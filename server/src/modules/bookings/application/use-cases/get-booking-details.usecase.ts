import { Injectable, NotFoundException } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { Property } from '../../../listings/domain/entities/property.entity'

export class GetBookingDetailsCommand {
   constructor(
      public readonly bookingId: string,
      public readonly userId: string,
      public readonly userRole: string
   ) {}
}

export interface GetBookingDetailsResult {
   booking: Booking
   payment: Payment | null
   property: Property | null
}

@Injectable()
export class GetBookingDetailsUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly listingsRepository: ListingsRepository
   ) {}

   async execute(command: GetBookingDetailsCommand): Promise<GetBookingDetailsResult> {
      const booking = await this.bookingsRepository.findById(command.bookingId)
      if (!booking) {
         throw new NotFoundException('Booking not found')
      }

      const isAdmin = command.userRole === 'admin'
      const isGuest = command.userRole === 'guest' && booking.guestId === command.userId
      const isHost = command.userRole === 'host' && booking.hostId === command.userId
      if (!isAdmin && !isGuest && !isHost) {
         // Return 404 so callers cannot use this endpoint to discover another user's bookings.
         throw new NotFoundException('Booking not found')
      }

      const payment = await this.bookingsRepository.findPaymentByBookingId(booking.id)
      const property = await this.listingsRepository.findById(booking.propertyId)

      return {
         booking,
         payment,
         property
      }
   }
}
