import { Injectable } from '@nestjs/common'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'

export class GetBookedDatesQuery {
   constructor(public readonly propertyId: string) {}
}

@Injectable()
export class GetBookedDatesUseCase {
   constructor(
      private readonly bookingsRepository: BookingsRepository,
      private readonly bookedDatesCachePort: BookedDatesCachePort
   ) {}

   async execute(query: GetBookedDatesQuery): Promise<string[]> {
      const propertyId = query.propertyId
      let dates = await this.bookedDatesCachePort.getBookedDates(propertyId)

      if (dates === null) {
         // Cache miss: load active bookings from database, extract dates, and populate cache
         const activeBookings =
            await this.bookingsRepository.findActiveBookingsByPropertyId(propertyId)
         const dbBookedDates: string[] = []
         for (const ab of activeBookings) {
            const abDates = this.generateDateStrings(ab.checkIn, ab.checkOut)
            dbBookedDates.push(...abDates)
         }
         await this.bookedDatesCachePort.setBookedDates(propertyId, dbBookedDates)
         dates = dbBookedDates
      }

      // Filter out the dummy "EMPTY" element to avoid disabling it on the client
      return dates.filter((d) => d !== 'EMPTY')
   }

   private generateDateStrings(checkIn: Date, checkOut: Date): string[] {
      const dates: string[] = []
      const curr = new Date(checkIn)
      const end = new Date(checkOut)
      while (curr <= end) {
         dates.push(curr.toISOString().split('T')[0])
         curr.setDate(curr.getDate() + 1)
      }
      return dates
   }
}
