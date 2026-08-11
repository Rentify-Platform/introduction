import { Property } from '../../../listings/domain/entities/property.entity'

export interface SearchParams {
   query?: string
   city?: string
   checkIn?: Date
   checkOut?: Date
   guests?: number
   minPrice?: number
   maxPrice?: number
   latitude?: number
   longitude?: number
   radiusKm?: number
   roomType?: string
   propertyType?: string
   amenities?: string[]
   page: number
   limit: number
   sortBy?: string
}

export interface SearchResult {
   items: Property[]
   total: number
}

export interface ReviewDetail {
   id: string
   rating: number
   comment: string | null
   createdAt: Date
   authorName: string
   authorAvatarUrl: string | null
   hostResponse: string | null
}

export interface ListingDetail {
   property: Property
   reviews: ReviewDetail[]
   averageRating: number
   totalReviews: number
}

export abstract class SearchRepository {
   abstract search(params: SearchParams): Promise<SearchResult>
   abstract findListingDetail(id: string): Promise<ListingDetail | null>
}
