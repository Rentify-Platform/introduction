import { Injectable } from '@nestjs/common'
import { Property } from '../../domain/entities/property.entity'
import {
   PropertyNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class RestoreListingCommand {
   constructor(
      public readonly propertyId: string,
      public readonly hostId: string
   ) {}
}

@Injectable()
export class RestoreListingUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: RestoreListingCommand): Promise<Property> {
      // 1. Fetch the archived property
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Authorize ownership
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3. Restore to draft (clears deletedAt, resets status to draft)
      const restored = property.restore()

      // 4. Persist restored state
      return this.listingsRepository.save(restored)
   }
}
