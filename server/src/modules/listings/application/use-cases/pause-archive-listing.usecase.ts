import { Injectable } from '@nestjs/common'
import { Property } from '../../domain/entities/property.entity'
import {
   PropertyNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class PauseArchiveListingCommand {
   constructor(
      public readonly propertyId: string,
      public readonly hostId: string,
      public readonly action: 'pause' | 'archive'
   ) {}
}

@Injectable()
export class PauseArchiveListingUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: PauseArchiveListingCommand): Promise<Property> {
      // 1. Fetch property
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Authorize ownership
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3. Update domain model based on action
      let updatedProperty: Property
      if (command.action === 'pause') {
         updatedProperty = property.pause()
      } else {
         updatedProperty = property.archive()
      }

      // 4. Save property
      return this.listingsRepository.save(updatedProperty)
   }
}
