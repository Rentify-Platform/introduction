import { ListingResponse } from '../../../../modules/listings/presentation/responses/listing.response'

export interface ReviewResponse {
   id: string
   rating: number
   comment: string | null
   createdAt: Date
   authorName: string
   authorAvatarUrl: string | null
   hostResponse: string | null
}

export class ListingDetailResponse {
   constructor(
      public readonly property: ListingResponse,
      public readonly reviews: ReviewResponse[],
      public readonly averageRating: number,
      public readonly totalReviews: number
   ) {}
}
