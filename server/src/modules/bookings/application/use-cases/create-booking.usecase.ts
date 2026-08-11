import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { BookingLockPort } from '../ports/booking-lock.port'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'
import { PaymentGatewayPort } from '../ports/payment-gateway.port'
import { PAYMENT_TIMEOUT_SECONDS } from '../../bookings.constants'

export class CreateBookingCommand {
   constructor(
      public readonly propertyId: string,
      public readonly guestId: string,
      public readonly checkInStr: string,
      public readonly checkOutStr: string,
      public readonly guestsCount: number
   ) {}
}

export interface CreateBookingResult {
   booking: Booking
   payment: Payment
}

@Injectable()
export class CreateBookingUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly listingsRepository: ListingsRepository,
      private readonly bookingLockPort: BookingLockPort,
      private readonly bookedDatesCachePort: BookedDatesCachePort,
      private readonly paymentGatewayPort: PaymentGatewayPort
   ) {}

   private generateDateStrings(checkIn: Date, checkOut: Date): string[] {
      const dates: string[] = []
      const current = new Date(checkIn)
      const end = new Date(checkOut)

      current.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      while (current < end) {
         const yyyy = current.getFullYear()
         const mm = String(current.getMonth() + 1).padStart(2, '0')
         const dd = String(current.getDate()).padStart(2, '0')
         dates.push(`${yyyy}-${mm}-${dd}`)
         current.setDate(current.getDate() + 1)
      }
      return dates
   }

   async execute(command: CreateBookingCommand): Promise<CreateBookingResult> {
      // 1.   Parse and validate booking dates
      const checkIn = new Date(command.checkInStr)
      const checkOut = new Date(command.checkOutStr)

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
         throw new BadRequestException('Invalid check-in or checkout date')
      }

      if (checkIn >= checkOut) {
         throw new BadRequestException('Checkout date must be after check-in date')
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (checkIn < today) {
         throw new BadRequestException('Check-in date cannot be in the past')
      }

      // 2.   Retrieve and validate property listing
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new NotFoundException('Property not found')
      }

      if (property.status !== 'active') {
         throw new BadRequestException('Property is not available for booking')
      }

      if (command.guestsCount <= 0 || command.guestsCount > property.maxGuests) {
         throw new BadRequestException(`Guests count must be between 1 and ${property.maxGuests}`)
      }

      // 3.   Check for booking rules and host validation
      if (property.hostId === command.guestId) {
         throw new BadRequestException('Host cannot book their own property')
      }

      // Generate date strings for requested range
      const targetDates = this.generateDateStrings(checkIn, checkOut)

      // 4.   Fast check confirmed booked dates via Redis cache
      let cachedBookedDates = await this.bookedDatesCachePort.getBookedDates(property.id)
      if (cachedBookedDates === null) {
         // Cache miss: load active bookings from database, extract dates, and populate cache
         const activeBookings = await this.bookingsRepository.findActiveBookingsByPropertyId(
            property.id
         )
         const dbBookedDates: string[] = []
         for (const ab of activeBookings) {
            const abDates = this.generateDateStrings(ab.checkIn, ab.checkOut)
            dbBookedDates.push(...abDates)
         }
         await this.bookedDatesCachePort.setBookedDates(property.id, dbBookedDates)
         cachedBookedDates = dbBookedDates
      }

      const isCachedOverlapping = targetDates.some((date) => cachedBookedDates.includes(date))
      if (isCachedOverlapping) {
         throw new BadRequestException('This property is already booked for the selected dates')
      }

      // 5.   Create booking domain entity to generate the booking ID
      const booking = Booking.create({
         propertyId: property.id,
         guestId: command.guestId,
         hostId: property.hostId,
         checkIn,
         checkOut,
         guestsCount: command.guestsCount,
         nightlyRateCents: property.basePriceCents,
         cleaningFeeCents: property.cleaningFeeCents,
         cancellationPolicyCode: property.cancellationPolicyCode,
         currency: property.currency
      })

      // 6.   Attempt to acquire temporary lock in Redis (1-minute payment timeout)
      const lockAcquired = await this.bookingLockPort.acquireLock(
         property.id,
         checkIn,
         checkOut,
         booking.id,
         PAYMENT_TIMEOUT_SECONDS
      )

      if (!lockAcquired) {
         throw new BadRequestException(
            'This property is temporarily blocked for booking. Please try again in a few minutes.'
         )
      }

      try {
         // 7.   Verify database booking availability (overlap check as final safety)
         const isOverlapping = await this.bookingsRepository.checkOverlappingBooking(
            property.id,
            checkIn,
            checkOut
         )
         if (isOverlapping) {
            throw new BadRequestException('This property is already booked for the selected dates')
         }
      } catch (error) {
         // Release lock immediately if database verification fails or throws an exception
         await this.bookingLockPort.releaseLock(property.id, checkIn, checkOut)
         throw error
      }

      // 8.   Persist booking to database
      const savedBooking = await this.bookingsRepository.save(booking)

      // 9.   Generate SePay payment intent and request dynamic Virtual Account
      const intentCode = `RENTIFY${savedBooking.id.split('-')[0].toUpperCase()}`

      let vaNumber: string | null = null
      let qrCodeUrl: string | null = null

      try {
         const orderResult = await this.paymentGatewayPort.createOrder({
            orderCode: intentCode,
            amountCents: savedBooking.totalPriceCents,
            durationSeconds: PAYMENT_TIMEOUT_SECONDS
         })
         vaNumber = orderResult.vaNumber
         qrCodeUrl = orderResult.qrCodeUrl
      } catch (err) {
         // Fallback gracefully (log error, leave variables null)
      }

      // Store combined vaNumber and qrCodeUrl in paymentMethodId field
      const paymentMethodId = vaNumber && qrCodeUrl ? `${vaNumber}|${qrCodeUrl}` : null

      const payment = Payment.createSepayPayment({
         bookingId: savedBooking.id,
         amountCents: savedBooking.totalPriceCents,
         currency: savedBooking.currency,
         providerIntentId: intentCode,
         paymentMethodId
      })

      // 10.  Persist payment to database
      const savedPayment = await this.bookingsRepository.savePayment(payment)

      // 11.  Invalidate booked dates cache to reflect new pending booking on calendar
      await this.bookedDatesCachePort.invalidate(property.id)

      return {
         booking: savedBooking,
         payment: savedPayment
      }
   }
}
