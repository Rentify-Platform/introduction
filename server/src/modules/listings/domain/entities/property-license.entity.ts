import { randomUUID } from 'crypto'

export type PropertyLicenseStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export class PropertyLicense {
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

   static create(params: {
      propertyId: string
      licenseNumber?: string | null
      issuingAuthority?: string | null
      fileUrl?: string | null
      expiryDate?: Date | null
   }): PropertyLicense {
      return new PropertyLicense(
         randomUUID(),
         params.propertyId,
         params.licenseNumber || null,
         params.issuingAuthority || null,
         params.fileUrl || null,
         params.expiryDate || null,
         'pending',
         null,
         new Date()
      )
   }

   verify(): PropertyLicense {
      return new PropertyLicense(
         this.id,
         this.propertyId,
         this.licenseNumber,
         this.issuingAuthority,
         this.fileUrl,
         this.expiryDate,
         'verified',
         new Date(),
         this.createdAt
      )
   }
}
