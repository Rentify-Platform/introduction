import { Injectable } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { Property } from '../../../listings/domain/entities/property.entity'

export class GetGuestBookingsCommand {
   constructor(public readonly guestId: string) {}
}

export interface GuestBookingItem {
   booking: Booking
   payment: Payment | null
   property: Property | null
}

@Injectable()
export class GetGuestBookingsUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly listingsRepository: ListingsRepository
   ) {}

   async execute(command: GetGuestBookingsCommand): Promise<GuestBookingItem[]> {
      // 1.   Fetch all bookings for the guest from repository
      const bookings = await this.bookingsRepository.findManyByGuestId(command.guestId)

      // 2.   Loop and load payment & property details for each booking item
      const items: GuestBookingItem[] = []
      for (const booking of bookings) {
         const payment = await this.bookingsRepository.findPaymentByBookingId(booking.id)
         const property = await this.listingsRepository.findById(booking.propertyId)
         items.push({
            booking,
            payment,
            property
         })
      }

      return items
   }
}
