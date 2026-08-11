import { Injectable } from '@nestjs/common'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { PropertyLicense } from '../../domain/entities/property-license.entity'
import { PropertyNotFoundException } from '../../domain/errors/listings.errors'

export class GetPropertyLicenseAdminCommand {
   constructor(public readonly propertyId: string) {}
}

@Injectable()
export class GetPropertyLicenseAdminUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: GetPropertyLicenseAdminCommand): Promise<PropertyLicense | null> {
      // 1. Ensure the property exists
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Return license (null if none submitted)
      return this.listingsRepository.findLicenseByPropertyId(command.propertyId)
   }
}
