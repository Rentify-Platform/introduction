import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../../../ledger/application/use-cases/post-transaction.usecase'
import { BookingLockPort } from '../ports/booking-lock.port'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'

export class ConfirmSepayPaymentCommand {
   constructor(
      public readonly transferAmount: number, // in VND (e.g. 150000)
      public readonly transactionContent: string, // contains "RENTIFYXXXX"
      public readonly gateway: string,
      public readonly transactionDate: string,
      public readonly referenceNumber: string
   ) {}
}

@Injectable()
export class ConfirmSepayPaymentUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly listingsRepository: ListingsRepository,
      private readonly postTransactionUseCase: PostTransactionUseCase,
      private readonly bookingLockPort: BookingLockPort,
      private readonly bookedDatesCachePort: BookedDatesCachePort
   ) {}

   async execute(
      command: ConfirmSepayPaymentCommand
   ): Promise<{ success: boolean; message: string }> {
      const { transactionContent, transferAmount } = command

      // 1.   Extract RENTIFYXXXX code from the transaction content
      const regex = /RENTIFY([A-Z0-9]{8})/i
      const match = transactionContent.match(regex)
      if (!match) {
         throw new BadRequestException('Transaction content does not match RENTIFY payment pattern')
      }

      const intentCode = match[0].toUpperCase()

      // 2.   Find payment by providerIntentId
      const payment = await this.bookingsRepository.findPaymentByIntentId('sepay', intentCode)
      if (!payment) {
         throw new NotFoundException(`Payment with code ${intentCode} not found`)
      }

      // 3.   Check if already captured
      if (payment.status === 'captured') {
         return {
            success: true,
            message: `Payment ${intentCode} was already confirmed.`
         }
      }

      // 4.   Compare transfer amount with payment amount
      // transferAmount is in VND. payment.amountCents is stored in cents (VND * 100)
      const expectedAmountCents = payment.amountCents
      const receivedAmountCents = BigInt(Math.round(transferAmount * 100))

      if (receivedAmountCents < expectedAmountCents) {
         // Mark payment as failed if underpaid
         const updatedPayment = new Payment(
            payment.id,
            payment.bookingId,
            payment.paymentMethodId,
            payment.ledgerTransactionId,
            'failed',
            payment.amountCents,
            payment.currency,
            payment.provider,
            payment.providerIntentId,
            `Underpaid: expected ${expectedAmountCents} cents, received ${receivedAmountCents} cents`,
            payment.createdAt,
            new Date()
         )
         await this.bookingsRepository.savePayment(updatedPayment)
         throw new BadRequestException('Received amount is less than expected amount')
      }

      // 5.   Retrieve the booking early to validate it exists and avoid orphans
      const booking = await this.bookingsRepository.findById(payment.bookingId)
      if (!booking) {
         throw new NotFoundException('Associated booking not found')
      }

      // Check if the booking was already expired or cancelled
      if (booking.status === 'expired' || booking.status.startsWith('cancelled')) {
         const isOverlapping = await this.bookingsRepository.checkOverlappingBooking(
            booking.propertyId,
            booking.checkIn,
            booking.checkOut
         )

         if (isOverlapping) {
            // Dates are already taken by another booking! Mark payment as failed
            const updatedPayment = new Payment(
               payment.id,
               payment.bookingId,
               payment.paymentMethodId,
               payment.ledgerTransactionId,
               'failed',
               payment.amountCents,
               payment.currency,
               payment.provider,
               payment.providerIntentId,
               `Payment received after booking was ${booking.status}, and dates are no longer available. Manual refund required.`,
               payment.createdAt,
               new Date()
            )
            await this.bookingsRepository.savePayment(updatedPayment)

            throw new BadRequestException(
               `Payment received for an expired/cancelled booking (${booking.status}) but dates are no longer available.`
            )
         }

         // If dates are still free, we gracefully allow confirming the booking.
      }

      // 6.   Post transaction to Ledger using payment ID as idempotency key
      const currency = payment.currency.toUpperCase()
      const ledgerEntries = [
         new PostTransactionEntryCommand(
            null,
            'platform',
            null,
            'escrow',
            payment.amountCents, // positive into escrow
            currency
         ),
         new PostTransactionEntryCommand(
            null,
            'platform',
            null,
            'clearing',
            -payment.amountCents, // negative offset clearing
            currency
         )
      ]

      const postTxnCommand = new PostTransactionCommand(
         payment.id, // Idempotency key
         'booking_payment',
         booking.id,
         `Payment captured for booking ${booking.id} via SePay webhook`,
         { gateway: command.gateway, referenceNumber: command.referenceNumber },
         null,
         ledgerEntries
      )

      const ledgerTxn = await this.postTransactionUseCase.execute(postTxnCommand)

      // 7.   Update payment to 'captured' and link ledger transaction ID
      const updatedPayment = new Payment(
         payment.id,
         payment.bookingId,
         payment.paymentMethodId,
         ledgerTxn.id,
         'captured',
         payment.amountCents,
         payment.currency,
         payment.provider,
         payment.providerIntentId,
         null,
         payment.createdAt,
         new Date()
      )
      await this.bookingsRepository.savePayment(updatedPayment)

      // 8.   Update booking to 'confirmed' or 'pending_approval' based on property instant book settings
      const property = await this.listingsRepository.findById(booking.propertyId)
      const targetStatus = property?.instantBook ? 'confirmed' : 'pending_approval'

      const updatedBooking = new Booking(
         booking.id,
         booking.propertyId,
         booking.guestId,
         booking.hostId,
         targetStatus,
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
         booking.cancelledAt,
         booking.createdAt,
         new Date()
      )
      await this.bookingsRepository.save(updatedBooking)

      // 9.   Release temporary Redis lock since booking is now confirmed in database
      await this.bookingLockPort.releaseLock(booking.propertyId, booking.checkIn, booking.checkOut)

      // 10.  Invalidate confirmed booked dates cache for this property
      await this.bookedDatesCachePort.invalidate(booking.propertyId)

      return {
         success: true,
         message: `Payment confirmed and booking ${booking.id} is active.`
      }
   }
}
