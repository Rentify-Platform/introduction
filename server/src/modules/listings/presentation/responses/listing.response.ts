import { PropertyRoomType, PropertyStatus } from '../../domain/entities/property.entity'

export interface AmenityResponse {
   id: number
   name: string
}

export class ListingResponse {
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
      public readonly basePriceCents: string,
      public readonly cleaningFeeCents: string,
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
      public readonly amenities: AmenityResponse[],
      public readonly photoUrls: string[],
      public readonly price: number,
      public readonly thumbnailUrl: string
   ) {}
}
