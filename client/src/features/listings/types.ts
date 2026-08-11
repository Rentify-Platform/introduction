export interface Amenity {
   id: number
   name: string
}

export interface Listing {
   id: string
   hostId: string
   propertyTypeId: number
   roomType: string
   status: string
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
   basePriceCents: string
   cleaningFeeCents: string
   currency: string
   minimumNights: number
   maximumNights: number
   checkInTime: string
   checkOutTime: string
   instantBook: boolean
   cancellationPolicyCode: string
   requiresLocalLicense: boolean
   createdAt: string
   updatedAt: string
   publishedAt: string | null
   deletedAt: string | null
   amenities: Amenity[]
   photoUrls: string[]
   price: number
   thumbnailUrl: string
}

export interface SearchListingsResponse {
   items: Listing[]
   page: number
   limit: number
   total: number
   totalPages: number
}

export interface SearchListingsParams {
   query?: string
   city?: string
   checkIn?: string
   checkOut?: string
   guests?: number
   minPrice?: number
   maxPrice?: number
   latitude?: number
   longitude?: number
   radiusKm?: number
   roomType?: string
   propertyType?: string
   amenities?: string[] | string
   page?: number
   limit?: number
   sortBy?: string
}

export interface Review {
   id: string
   rating: number
   comment: string
   createdAt: string
   authorName: string
   authorAvatarUrl: string | null
   hostResponse: string | null
}

export interface ListingDetail {
   property: Listing
   reviews: Review[]
   averageRating: number
   totalReviews: number
}

export interface CreateDraftListingInput {
   propertyTypeId: number
   roomType: string
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
   bedrooms: number
   beds: number
   bathrooms: number
   basePriceCents: string | number
   cleaningFeeCents: string | number
   currency?: string
   minimumNights?: number
   maximumNights?: number
   checkInTime?: string
   checkOutTime?: string
   instantBook?: boolean
   cancellationPolicyCode?: string
   requiresLocalLicense?: boolean
   amenityIds: number[]
   photoUrls: string[]
}
