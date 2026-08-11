import { Injectable } from '@nestjs/common'
import { PropertyLicense } from '../../domain/entities/property-license.entity'
import {
   PropertyNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class SubmitPropertyLicenseCommand {
   constructor(
      public readonly propertyId: string,
      public readonly hostId: string,
      public readonly licenseNumber: string,
      public readonly issuingAuthority: string,
      public readonly fileUrl: string,
      public readonly expiryDate: Date | null
   ) {}
}

@Injectable()
export class SubmitPropertyLicenseUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: SubmitPropertyLicenseCommand): Promise<PropertyLicense> {
      // 1. Fetch property
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Authorize ownership
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3. Create property license in pending status
      const license = PropertyLicense.create({
         propertyId: command.propertyId,
         licenseNumber: command.licenseNumber,
         issuingAuthority: command.issuingAuthority,
         fileUrl: command.fileUrl,
         expiryDate: command.expiryDate
      })

      // 4. Save initially as pending
      await this.listingsRepository.saveLicense(license)

      // 5. Simulate automated registry check (auto-verify)
      const verifiedLicense = license.verify()
      const savedLicense = await this.listingsRepository.saveLicense(verifiedLicense)

      return savedLicense
   }
}
