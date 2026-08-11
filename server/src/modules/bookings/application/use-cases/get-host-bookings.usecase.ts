import { Injectable } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'
import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { Property } from '../../../listings/domain/entities/property.entity'

export class GetHostBookingsCommand {
   constructor(public readonly hostId: string) {}
}

export interface HostBookingItem {
   booking: Booking
   payment: Payment | null
   property: Property | null
}

@Injectable()
export class GetHostBookingsUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly listingsRepository: ListingsRepository
   ) {}

   async execute(command: GetHostBookingsCommand): Promise<HostBookingItem[]> {
      // 1.   Fetch all bookings for properties managed by the host
      const bookings = await this.bookingsRepository.findManyByHostId(command.hostId)

      // 2.   Retrieve payment detail and listing detail for each booking record
      const items: HostBookingItem[] = []
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
