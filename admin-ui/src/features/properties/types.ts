export type PropertyStatus = 'draft' | 'active' | 'paused' | 'archived'
export type PropertyRoomType = 'entire_place' | 'private_room' | 'shared_room' | 'hotel_room'

export interface PropertySummary {
   id: string
   hostId: string
   propertyTypeId: number
   roomType: PropertyRoomType
   status: PropertyStatus
   title: string
   description: string | null
   addressLine1: string
   city: string
   countryCode: string
   maxGuests: number
   bedrooms: number
   beds: number
   bathrooms: number
   basePriceCents: string
   currency: string
   requiresLocalLicense: boolean
   thumbnailUrl: string
   photoUrls: string[]
   createdAt: string
   publishedAt: string | null
}

export interface PaginatedProperties {
   data: PropertySummary[]
   total: number
   page: number
   limit: number
}

export interface PropertyLicense {
   id: string
   propertyId: string
   licenseNumber: string | null
   issuingAuthority: string | null
   fileUrl: string | null
   expiryDate: string | null
   status: 'pending' | 'verified' | 'rejected' | 'expired'
   verifiedAt: string | null
   createdAt: string
}

export interface PropertiesFilter {
   search?: string
   status?: PropertyStatus | ''
   page?: number
   limit?: number
}
