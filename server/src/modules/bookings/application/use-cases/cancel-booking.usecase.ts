import {
   Injectable,
   NotFoundException,
   BadRequestException,
   ForbiddenException
} from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { Booking, BookingStatus } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { PrismaService } from '../../../../prisma/prisma.service'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../../../ledger/application/use-cases/post-transaction.usecase'
import { booking_status, cancelled_by_role } from '@prisma/client'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'

export class CancelBookingCommand {
   constructor(
      public readonly bookingId: string,
      public readonly userId: string,
      public readonly role: string,
      public readonly reason: string | null
   ) {}
}

@Injectable()
export class CancelBookingUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly prisma: PrismaService,
      private readonly postTransactionUseCase: PostTransactionUseCase,
      private readonly bookedDatesCachePort: BookedDatesCachePort
   ) {}

   async execute(
      command: CancelBookingCommand
   ): Promise<{ booking: Booking; payment: Payment | null }> {
      // 1.   Fetch booking detail
      const booking = await this.bookingsRepository.findById(command.bookingId)
      if (!booking) {
         throw new NotFoundException('Booking not found')
      }

      // 2.   Check if booking can be cancelled (must be pending, pending_approval, or confirmed)
      if (booking.status !== 'pending' && booking.status !== 'pending_approval' && booking.status !== 'confirmed') {
         throw new BadRequestException(
            `Booking cannot be cancelled in its current status: ${booking.status}`
         )
      }

      // 3.   Authorize role and action
      let determinedRole: 'guest' | 'host' | 'admin'
      let newStatus: BookingStatus

      if (command.role === 'admin') {
         determinedRole = 'admin'
         newStatus = 'cancelled_by_host' // or map to default admin cancel status
      } else if (booking.guestId === command.userId) {
         determinedRole = 'guest'
         newStatus = 'cancelled_by_guest'
      } else if (booking.hostId === command.userId) {
         determinedRole = 'host'
         newStatus = 'cancelled_by_host'
      } else {
         throw new ForbiddenException('You are not authorized to cancel this booking')
      }

      // 4.   Retrieve associated payment if confirmed
      const payment = await this.bookingsRepository.findPaymentByBookingId(booking.id)
      const hasPayment = payment && payment.status === 'captured'

      let guestRefundCents = 0n
      let hostPayoutCents = 0n
      let platformFeeCents = 0n
      let matchedTierId: bigint | null = null

      if (hasPayment) {
         if (booking.status === 'pending_approval') {
            // A request-to-book that hasn't been approved yet gets a 100% refund
            guestRefundCents = booking.totalPriceCents
            hostPayoutCents = 0n
            platformFeeCents = 0n
         } else {
            // 5.   Calculate days until check-in for policy tier matching
            const now = new Date()
            const appliesAfterCheckin = now >= booking.checkIn
            const diffTime = booking.checkIn.getTime() - now.getTime()
            const daysBeforeCheckin = appliesAfterCheckin
               ? 0
               : Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

            // 6.   Query policy tiers from database
            const tiers = await this.prisma.cancellation_policy_tiers.findMany({
               where: {
                  policy_code: booking.cancellationPolicyCode,
                  applies_after_checkin: appliesAfterCheckin
               },
               orderBy: {
                  min_days_before_checkin: 'desc'
               }
            })

            // 7.   Match appropriate tier based on days before check-in
            let matchedTier = tiers.find((t) => daysBeforeCheckin >= t.min_days_before_checkin)

            if (!matchedTier && tiers.length > 0) {
               // Default fallback is the tier with the lowest min_days_before_checkin
               matchedTier = tiers[tiers.length - 1]
            }

            if (matchedTier) {
               matchedTierId = matchedTier.id
               const guestRefundPct = Number(matchedTier.guest_refund_pct) / 100
               const hostPayoutPct = Number(matchedTier.host_payout_pct) / 100

               const nightlyTotalCents = booking.nightlyRateCents * BigInt(booking.nights)

               // 8.   Calculate refund breakdown parts
               const refundNightlyCents = BigInt(
                  Math.round(Number(nightlyTotalCents) * guestRefundPct)
               )
               const refundCleaningCents = matchedTier.refund_cleaning_fee
                  ? booking.cleaningFeeCents
                  : 0n
               const refundServiceCents = matchedTier.refund_service_fee ? booking.serviceFeeCents : 0n
               const refundTaxesCents = BigInt(
                  Math.round(Number(booking.taxesCents) * (Number(matchedTier.refund_taxes_pct) / 100))
               )

               guestRefundCents =
                  refundNightlyCents + refundCleaningCents + refundServiceCents + refundTaxesCents

               // 9.   Calculate host payout breakdown parts
               const payoutNightlyCents = BigInt(Math.round(Number(nightlyTotalCents) * hostPayoutPct))
               const payoutCleaningCents = matchedTier.refund_cleaning_fee
                  ? 0n
                  : booking.cleaningFeeCents

               hostPayoutCents = payoutNightlyCents + payoutCleaningCents

               // 10.   Platform keeps the remainder
               platformFeeCents = booking.totalPriceCents - guestRefundCents - hostPayoutCents
               if (platformFeeCents < 0n) {
                  platformFeeCents = 0n
               }
            } else {
               // Fallback default: 100% refund to guest
               guestRefundCents = booking.totalPriceCents
               hostPayoutCents = 0n
               platformFeeCents = 0n
            }
         }
      }

      // 11.   Generate ledger double-entry transaction if payment exists
      let ledgerTxnId: string | null = null
      if (hasPayment && booking.totalPriceCents > 0n) {
         const currency = booking.currency.toUpperCase()
         const ledgerEntries: PostTransactionEntryCommand[] = []

         // 12.   Debit platform escrow (reduce escrow account)
         ledgerEntries.push(
            new PostTransactionEntryCommand(
               null,
               'platform',
               null,
               'escrow',
               -booking.totalPriceCents,
               currency
            )
         )

         // 13.   Credit guest clearing/receivable (if any refund is due)
         if (guestRefundCents > 0n) {
            ledgerEntries.push(
               new PostTransactionEntryCommand(
                  null,
                  'guest',
                  booking.guestId,
                  'clearing',
                  guestRefundCents,
                  currency
               )
            )
         }

         // 14.   Credit host payable (if any host payout is due)
         if (hostPayoutCents > 0n) {
            ledgerEntries.push(
               new PostTransactionEntryCommand(
                  null,
                  'host',
                  booking.hostId,
                  'payable',
                  hostPayoutCents,
                  currency
               )
            )
         }

         // 15.   Credit platform clearing revenue (if platform keeps any fee)
         if (platformFeeCents > 0n) {
            ledgerEntries.push(
               new PostTransactionEntryCommand(
                  null,
                  'platform',
                  null,
                  'clearing',
                  platformFeeCents,
                  currency
               )
            )
         }

         const postTxnCommand = new PostTransactionCommand(
            `cancellation-${booking.id}`, // Idempotency key
            'refund',
            booking.id,
            `Refund/Payout processed for cancelled booking ${booking.id}`,
            { cancelledBy: command.userId, role: determinedRole },
            command.userId,
            ledgerEntries
         )

         const ledgerTxn = await this.postTransactionUseCase.execute(postTxnCommand)
         ledgerTxnId = ledgerTxn.id
      }

      // 16.   Save cancellation audit log and update booking status in transaction
      const updatedBooking = await this.prisma.$transaction(async (tx) => {
         // Create the cancellation audit record
         await tx.cancellations.create({
            data: {
               booking_id: booking.id,
               cancelled_by_account_id: command.userId,
               cancelled_by_role: determinedRole as cancelled_by_role,
               days_before_checkin: hasPayment
                  ? Math.ceil((booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0,
               applied_policy_code: booking.cancellationPolicyCode,
               applied_tier_id: matchedTierId,
               guest_refund_cents: guestRefundCents,
               host_payout_cents: hostPayoutCents,
               platform_fee_kept_cents: platformFeeCents,
               reason_text: command.reason,
               ledger_transaction_id: ledgerTxnId
            }
         })

         // Update booking status
         const updatedBooking = new Booking(
            booking.id,
            booking.propertyId,
            booking.guestId,
            booking.hostId,
            newStatus,
            booking.checkIn,
            booking.checkOut,
            booking.guestsCount,
            booking.nightlyRateCents,
            booking.nights,
            booking.cleaningFeeCents,
            booking.serviceFeeCents,
            booking.taxesCents,
            booking.totalPriceCents,
            booking.currency,
            booking.cancellationPolicyCode,
            booking.bookedAt,
            new Date(),
            booking.createdAt,
            new Date()
         )

         await tx.bookings.update({
            where: { id: booking.id },
            data: {
               status: newStatus as booking_status,
               cancelled_at: updatedBooking.cancelledAt,
               updated_at: updatedBooking.updatedAt
            }
         })

         return updatedBooking
      })

      // 17.  Invalidate confirmed booked dates cache for this property
      await this.bookedDatesCachePort.invalidate(booking.propertyId)

      return { booking: updatedBooking, payment }
   }
}
