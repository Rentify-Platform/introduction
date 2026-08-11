import { Injectable } from '@nestjs/common'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { Property } from '../../domain/entities/property.entity'
import { PropertyNotFoundException } from '../../domain/errors/listings.errors'

export class UpdatePropertyStatusAdminCommand {
   constructor(
      public readonly propertyId: string,
      public readonly status: 'active' | 'paused' | 'archived'
   ) {}
}

@Injectable()
export class UpdatePropertyStatusAdminUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: UpdatePropertyStatusAdminCommand): Promise<Property> {
      // 1. Ensure property exists
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Apply the status override (admin bypasses normal state machine)
      return this.listingsRepository.updatePropertyStatus(command.propertyId, command.status)
   }
}
