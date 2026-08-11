import { Injectable } from '@nestjs/common'
import {
   ListingsRepository,
   FindAllPropertiesFilter,
   PaginatedProperties
} from '../../domain/repositories/listings.repository'

export class ListPropertiesAdminCommand {
   constructor(
      public readonly search?: string,
      public readonly status?: string,
      public readonly hostId?: string,
      public readonly page?: number,
      public readonly limit?: number
   ) {}
}

@Injectable()
export class ListPropertiesAdminUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: ListPropertiesAdminCommand): Promise<PaginatedProperties> {
      // 1. Build filter from command
      const filter: FindAllPropertiesFilter = {
         search: command.search,
         status: command.status,
         hostId: command.hostId,
         page: command.page ?? 1,
         limit: command.limit ?? 20
      }

      // 2. Delegate to repository
      return this.listingsRepository.findAllAdmin(filter)
   }
}
