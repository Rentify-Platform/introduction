import { randomUUID } from 'crypto'

export type PropertyRoomType = 'entire_place' | 'private_room' | 'shared_room' | 'hotel_room'
export type PropertyStatus = 'draft' | 'active' | 'paused' | 'archived'

export interface PropertyAmenity {
   id: number
   name: string
}

export class Property {
   constructor(
      public readonly id: string,
      public readonly hostId: string,
      public readonly propertyTypeId: number,
      public readonly roomType: PropertyRoomType,
      public readonly status: PropertyStatus,
      public readonly title: string,
      public readonly description: string | null,
      public readonly addressLine1: string,
      public readonly addressLine2: string | null,
      public readonly city: string,
      public readonly stateProvince: string | null,
      public readonly countryCode: string,
      public readonly postalCode: string | null,
      public readonly latitude: number,
      public readonly longitude: number,
      public readonly maxGuests: number,
      public readonly bedrooms: number,
      public readonly beds: number,
      public readonly bathrooms: number,
      public readonly basePriceCents: bigint,
      public readonly cleaningFeeCents: bigint,
      public readonly currency: string,
      public readonly minimumNights: number,
      public readonly maximumNights: number,
      public readonly checkInTime: string,
      public readonly checkOutTime: string,
      public readonly instantBook: boolean,
      public readonly cancellationPolicyCode: string,
      public readonly requiresLocalLicense: boolean,
      public readonly createdAt: Date,
      public readonly updatedAt: Date,
      public readonly publishedAt: Date | null,
      public readonly deletedAt: Date | null,
      public readonly amenities: PropertyAmenity[] = [],
      public readonly photoUrls: string[] = []
   ) {}

   static create(params: {
      hostId: string
      propertyTypeId: number
      roomType: PropertyRoomType
      title: string
      description?: string | null
      addressLine1: string
      addressLine2?: string | null
      city: string
      stateProvince?: string | null
      countryCode: string
      postalCode?: string | null
      latitude: number
      longitude: number
      maxGuests: number
      bedrooms?: number
      beds?: number
      bathrooms?: number
      basePriceCents: bigint
      cleaningFeeCents?: bigint
      currency?: string
      minimumNights?: number
      maximumNights?: number
      checkInTime?: string
      checkOutTime?: string
      instantBook?: boolean
      cancellationPolicyCode?: string
      requiresLocalLicense?: boolean
      amenities?: PropertyAmenity[]
      photoUrls?: string[]
   }): Property {
      if (params.title.trim().length === 0) {
         throw new Error('Title cannot be empty')
      }
      if (params.basePriceCents < 0n) {
         throw new Error('Base price cannot be negative')
      }
      if (params.maxGuests <= 0) {
         throw new Error('Max guests must be greater than zero')
      }

      return new Property(
         randomUUID(),
         params.hostId,
         params.propertyTypeId,
         params.roomType,
         'draft',
         params.title.trim(),
         params.description || null,
         params.addressLine1.trim(),
         params.addressLine2 || null,
         params.city.trim(),
         params.stateProvince || null,
         params.countryCode.trim().toUpperCase(),
         params.postalCode || null,
         params.latitude,
         params.longitude,
         params.maxGuests,
         params.bedrooms || 0,
         params.beds || 0,
         params.bathrooms || 0,
         params.basePriceCents,
         params.cleaningFeeCents || 0n,
         params.currency || 'VND',
         params.minimumNights || 1,
         params.maximumNights || 365,
         params.checkInTime || '15:00',
         params.checkOutTime || '11:00',
         params.instantBook || false,
         params.cancellationPolicyCode || 'moderate',
         params.requiresLocalLicense || false,
         new Date(),
         new Date(),
         null,
         null,
         params.amenities || [],
         params.photoUrls || []
      )
   }

   update(params: {
      propertyTypeId: number
      roomType: PropertyRoomType
      title: string
      description: string | null
      addressLine1: string
      addressLine2: string | null
      city: string
      stateProvince: string | null
      countryCode: string
      postalCode: string | null
      latitude: number
      longitude: number
      maxGuests: number
      bedrooms: number
      beds: number
      bathrooms: number
      basePriceCents: bigint
      cleaningFeeCents: bigint
      currency: string
      minimumNights: number
      maximumNights: number
      checkInTime: string
      checkOutTime: string
      instantBook: boolean
      cancellationPolicyCode: string
      requiresLocalLicense: boolean
   }): Property {
      return new Property(
         this.id,
         this.hostId,
         params.propertyTypeId,
         params.roomType,
         this.status,
         params.title,
         params.description,
         params.addressLine1,
         params.addressLine2,
         params.city,
         params.stateProvince,
         params.countryCode,
         params.postalCode,
         params.latitude,
         params.longitude,
         params.maxGuests,
         params.bedrooms,
         params.beds,
         params.bathrooms,
         params.basePriceCents,
         params.cleaningFeeCents,
         params.currency,
         params.minimumNights,
         params.maximumNights,
         params.checkInTime,
         params.checkOutTime,
         params.instantBook,
         params.cancellationPolicyCode,
         params.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt,
         this.deletedAt,
         this.amenities,
         this.photoUrls
      )
   }

   updatePricingAndAvailability(params: {
      basePriceCents: bigint
      cleaningFeeCents?: bigint
      minimumNights?: number
      maximumNights?: number
      instantBook?: boolean
   }): Property {
      if (params.basePriceCents < 0n) {
         throw new Error('Base price cannot be negative')
      }

      return new Property(
         this.id,
         this.hostId,
         this.propertyTypeId,
         this.roomType,
         this.status,
         this.title,
         this.description,
         this.addressLine1,
         this.addressLine2,
         this.city,
         this.stateProvince,
         this.countryCode,
         this.postalCode,
         this.latitude,
         this.longitude,
         this.maxGuests,
         this.bedrooms,
         this.beds,
         this.bathrooms,
         params.basePriceCents,
         params.cleaningFeeCents !== undefined ? params.cleaningFeeCents : this.cleaningFeeCents,
         this.currency,
         params.minimumNights !== undefined ? params.minimumNights : this.minimumNights,
         params.maximumNights !== undefined ? params.maximumNights : this.maximumNights,
         this.checkInTime,
         this.checkOutTime,
         params.instantBook !== undefined ? params.instantBook : this.instantBook,
         this.cancellationPolicyCode,
         this.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt,
         this.deletedAt,
         this.amenities,
         this.photoUrls
      )
   }

   publish(hostKycVerified: boolean, hasVerifiedLicense: boolean): Property {
      if (!hostKycVerified) {
         throw new Error('Host must be KYC-verified before activating the listing')
      }

      if (this.requiresLocalLicense && !hasVerifiedLicense) {
         throw new Error('Property requires a verified local license to activate')
      }

      return new Property(
         this.id,
         this.hostId,
         this.propertyTypeId,
         this.roomType,
         'active',
         this.title,
         this.description,
         this.addressLine1,
         this.addressLine2,
         this.city,
         this.stateProvince,
         this.countryCode,
         this.postalCode,
         this.latitude,
         this.longitude,
         this.maxGuests,
         this.bedrooms,
         this.beds,
         this.bathrooms,
         this.basePriceCents,
         this.cleaningFeeCents,
         this.currency,
         this.minimumNights,
         this.maximumNights,
         this.checkInTime,
         this.checkOutTime,
         this.instantBook,
         this.cancellationPolicyCode,
         this.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt || new Date(),
         this.deletedAt,
         this.amenities,
         this.photoUrls
      )
   }

   pause(): Property {
      if (this.status !== 'active') {
         throw new Error('Only active properties can be paused')
      }

      return new Property(
         this.id,
         this.hostId,
         this.propertyTypeId,
         this.roomType,
         'paused',
         this.title,
         this.description,
         this.addressLine1,
         this.addressLine2,
         this.city,
         this.stateProvince,
         this.countryCode,
         this.postalCode,
         this.latitude,
         this.longitude,
         this.maxGuests,
         this.bedrooms,
         this.beds,
         this.bathrooms,
         this.basePriceCents,
         this.cleaningFeeCents,
         this.currency,
         this.minimumNights,
         this.maximumNights,
         this.checkInTime,
         this.checkOutTime,
         this.instantBook,
         this.cancellationPolicyCode,
         this.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt,
         this.deletedAt,
         this.amenities,
         this.photoUrls
      )
   }

   archive(): Property {
      return new Property(
         this.id,
         this.hostId,
         this.propertyTypeId,
         this.roomType,
         'archived',
         this.title,
         this.description,
         this.addressLine1,
         this.addressLine2,
         this.city,
         this.stateProvince,
         this.countryCode,
         this.postalCode,
         this.latitude,
         this.longitude,
         this.maxGuests,
         this.bedrooms,
         this.beds,
         this.bathrooms,
         this.basePriceCents,
         this.cleaningFeeCents,
         this.currency,
         this.minimumNights,
         this.maximumNights,
         this.checkInTime,
         this.checkOutTime,
         this.instantBook,
         this.cancellationPolicyCode,
         this.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt,
         new Date(), // deleted_at = now
         this.amenities,
         this.photoUrls
      )
   }

   restore(): Property {
      if (this.status !== 'archived') {
         throw new Error('Only archived properties can be restored')
      }

      return new Property(
         this.id,
         this.hostId,
         this.propertyTypeId,
         this.roomType,
         'draft',
         this.title,
         this.description,
         this.addressLine1,
         this.addressLine2,
         this.city,
         this.stateProvince,
         this.countryCode,
         this.postalCode,
         this.latitude,
         this.longitude,
         this.maxGuests,
         this.bedrooms,
         this.beds,
         this.bathrooms,
         this.basePriceCents,
         this.cleaningFeeCents,
         this.currency,
         this.minimumNights,
         this.maximumNights,
         this.checkInTime,
         this.checkOutTime,
         this.instantBook,
         this.cancellationPolicyCode,
         this.requiresLocalLicense,
         this.createdAt,
         new Date(),
         this.publishedAt,
         null, // clear deletedAt
         this.amenities,
         this.photoUrls
      )
   }
}
