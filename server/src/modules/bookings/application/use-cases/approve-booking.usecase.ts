import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'

export class ApproveBookingCommand {
   constructor(
      public readonly bookingId: string,
      public readonly hostId: string
   ) {}
}

@Injectable()
export class ApproveBookingUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly bookedDatesCachePort: BookedDatesCachePort
   ) {}

   async execute(command: ApproveBookingCommand): Promise<Booking> {
      // 1.   Fetch the booking detail by ID
      const booking = await this.bookingsRepository.findById(command.bookingId)
      if (!booking) {
         throw new NotFoundException('Booking not found')
      }

      // 2.   Verify the booking status is pending host approval
      if (booking.status !== 'pending_approval') {
         throw new BadRequestException(`Booking cannot be approved in its current status: ${booking.status}`)
      }

      // 3.   Authorize that the user executing this is the actual host of the property
      if (booking.hostId !== command.hostId) {
         throw new ForbiddenException('You are not authorized to approve this booking')
      }

      // 4.   Update status to confirmed and save the booking record
      const approvedBooking = new Booking(
         booking.id,
         booking.propertyId,
         booking.guestId,
         booking.hostId,
         'confirmed',
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
      await this.bookingsRepository.save(approvedBooking)

      // 5.   Invalidate confirmed booked dates cache for the property
      await this.bookedDatesCachePort.invalidate(booking.propertyId)

      return approvedBooking
   }
}
