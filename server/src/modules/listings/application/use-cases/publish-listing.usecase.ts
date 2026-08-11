import { Injectable } from '@nestjs/common'
import { Property } from '../../domain/entities/property.entity'
import {
   HostNotVerifiedException,
   PropertyLicenseRequiredException,
   PropertyNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class PublishListingCommand {
   constructor(
      public readonly propertyId: string,
      public readonly hostId: string
   ) {}
}

@Injectable()
export class PublishListingUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: PublishListingCommand): Promise<Property> {
      // 1. Fetch property
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Authorize ownership
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3. Check Host KYC verification status
      const hostKycVerified = await this.listingsRepository.checkHostKycVerified(command.hostId)
      if (!hostKycVerified) {
         throw new HostNotVerifiedException()
      }

      // 4. Check Property License if required
      let hasVerifiedLicense = false
      if (property.requiresLocalLicense) {
         const license = await this.listingsRepository.findVerifiedLicenseByPropertyId(
            command.propertyId
         )
         if (license && license.status === 'verified') {
            const hasExpired = license.expiryDate ? license.expiryDate < new Date() : false
            if (!hasExpired) {
               hasVerifiedLicense = true
            }
         }

         if (!hasVerifiedLicense) {
            throw new PropertyLicenseRequiredException()
         }
      }

      // 5. Update domain model state
      const publishedProperty = property.publish(hostKycVerified, hasVerifiedLicense)

      // 6. Save property
      return this.listingsRepository.save(publishedProperty)
   }
}
