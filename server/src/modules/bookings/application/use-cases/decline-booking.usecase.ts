import {
   Injectable,
   NotFoundException,
   BadRequestException,
   ForbiddenException
} from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'
import { PrismaService } from '../../../../prisma/prisma.service'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../../../ledger/application/use-cases/post-transaction.usecase'
import { booking_status, cancelled_by_role } from '@prisma/client'

export class DeclineBookingCommand {
   constructor(
      public readonly bookingId: string,
      public readonly hostId: string,
      public readonly reason: string | null,
      public readonly actorRole: string = 'host'
   ) {}
}

@Injectable()
export class DeclineBookingUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly prisma: PrismaService,
      private readonly postTransactionUseCase: PostTransactionUseCase,
      private readonly bookedDatesCachePort: BookedDatesCachePort
   ) {}

   async execute(command: DeclineBookingCommand): Promise<Booking> {
      // 1.   Fetch the booking detail by ID
      const booking = await this.bookingsRepository.findById(command.bookingId)
      if (!booking) {
         throw new NotFoundException('Booking not found')
      }

      // 2.   Verify the booking status is pending host approval
      if (booking.status !== 'pending_approval') {
         throw new BadRequestException(
            `Booking cannot be declined in its current status: ${booking.status}`
         )
      }

      // 3.   Authorize that the user executing this is the actual host of the property (admins bypass)
      if (command.actorRole !== 'admin' && booking.hostId !== command.hostId) {
         throw new ForbiddenException('You are not authorized to decline this booking')
      }

      // 4.   Retrieve associated payment
      const payment = await this.bookingsRepository.findPaymentByBookingId(booking.id)
      const hasPayment = payment && payment.status === 'captured'

      // 5.   Generate ledger double-entry transaction for a 100% refund if payment exists
      let ledgerTxnId: string | null = null
      if (hasPayment && booking.totalPriceCents > 0n) {
         const currency = booking.currency.toUpperCase()
         const ledgerEntries: PostTransactionEntryCommand[] = [
            new PostTransactionEntryCommand(
               null,
               'platform',
               null,
               'escrow',
               -booking.totalPriceCents,
               currency
            ),
            new PostTransactionEntryCommand(
               null,
               'guest',
               booking.guestId,
               'clearing',
               booking.totalPriceCents,
               currency
            )
         ]

         const postTxnCommand = new PostTransactionCommand(
            `decline-${booking.id}`,
            'refund',
            booking.id,
            `Refund processed for declined booking ${booking.id}`,
            { cancelledBy: command.hostId, role: command.actorRole },
            command.hostId,
            ledgerEntries
         )

         const ledgerTxn = await this.postTransactionUseCase.execute(postTxnCommand)
         ledgerTxnId = ledgerTxn.id
      }

      // 6.   Atomically record cancellation audit and update booking status in database
      const updatedBooking = await this.prisma.$transaction(async (tx) => {
         await tx.cancellations.create({
            data: {
               booking_id: booking.id,
               cancelled_by_account_id: command.hostId,
               cancelled_by_role: command.actorRole as cancelled_by_role,
               days_before_checkin: Math.ceil(
                  (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
               ),
               applied_policy_code: booking.cancellationPolicyCode,
               applied_tier_id: null,
               guest_refund_cents: booking.totalPriceCents,
               host_payout_cents: 0n,
               platform_fee_kept_cents: 0n,
               reason_text: command.reason,
               ledger_transaction_id: ledgerTxnId
            }
         })

         const newStatus = 'cancelled_by_host'
         const declinedBooking = new Booking(
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
               status: newStatus,
               cancelled_at: declinedBooking.cancelledAt,
               updated_at: declinedBooking.updatedAt
            }
         })

         return declinedBooking
      })

      // 7.   Invalidate booked dates cache
      await this.bookedDatesCachePort.invalidate(booking.propertyId)

      return updatedBooking
   }
}
