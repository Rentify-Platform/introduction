import { Injectable } from '@nestjs/common'
import {
   BookingsRepository,
   FindAllBookingsFilter,
   PaginatedAdminBookings
} from '../../domain/repositories/bookings.repository'

export class ListAllBookingsCommand {
   constructor(
      public readonly search?: string,
      public readonly status?: string,
      public readonly guestId?: string,
      public readonly hostId?: string,
      public readonly propertyId?: string,
      public readonly page?: number,
      public readonly limit?: number
   ) {}
}

@Injectable()
export class ListAllBookingsUseCase {
   constructor(private readonly bookingsRepository: BookingsRepository) {}

   async execute(command: ListAllBookingsCommand): Promise<PaginatedAdminBookings> {
      // 1. Build filter from command
      const filter: FindAllBookingsFilter = {
         search: command.search,
         status: command.status,
         guestId: command.guestId,
         hostId: command.hostId,
         propertyId: command.propertyId,
         page: command.page ?? 1,
         limit: command.limit ?? 20
      }

      // 2. Delegate to repository
      return this.bookingsRepository.findAll(filter)
   }
}
