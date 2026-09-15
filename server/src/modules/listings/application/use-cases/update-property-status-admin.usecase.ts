import { Injectable } from '@nestjs/common'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { Property } from '../../domain/entities/property.entity'
import {
   HostNotVerifiedException,
   PropertyLicenseRequiredException,
   PropertyNotFoundException
} from '../../domain/errors/listings.errors'

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

      // 2. Activation preserves the platform's KYC and license invariants,
      // aligned with the host publish flow: KYC is always required, a verified
      // license only when the property itself requires a local license
      if (command.status === 'active') {
         const hostKycVerified = await this.listingsRepository.checkHostKycVerified(property.hostId)
         if (!hostKycVerified) {
            throw new HostNotVerifiedException()
         }

         if (property.requiresLocalLicense) {
            const license = await this.listingsRepository.findVerifiedLicenseByPropertyId(
               property.id
            )
            const hasExpired = license?.expiryDate ? license.expiryDate < new Date() : false
            if (!license || hasExpired) {
               throw new PropertyLicenseRequiredException()
            }
         }
      }

      // 3. Apply the requested admin status change
      return this.listingsRepository.updatePropertyStatus(command.propertyId, command.status)
   }
}
