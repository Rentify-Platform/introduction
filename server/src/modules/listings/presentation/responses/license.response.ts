import { PropertyLicenseStatus } from '../../domain/entities/property-license.entity'

export class PropertyLicenseResponse {
   constructor(
      public readonly id: string,
      public readonly propertyId: string,
      public readonly licenseNumber: string | null,
      public readonly issuingAuthority: string | null,
      public readonly fileUrl: string | null,
      public readonly expiryDate: Date | null,
      public readonly status: PropertyLicenseStatus,
      public readonly verifiedAt: Date | null,
      public readonly createdAt: Date
   ) {}
}
