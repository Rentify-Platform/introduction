import { ListingsMapper } from '../../../../modules/listings/presentation/mappers/listings.mapper'
import { SearchResult, ListingDetail } from '../../domain/repositories/search.repository'
import { SearchListingsResponse } from '../responses/search-listings.response'
import { ListingDetailResponse } from '../responses/listing-detail.response'

export class SearchMapper {
   static toSearchResponse(
      result: SearchResult,
      page: number,
      limit: number
   ): SearchListingsResponse {
      const items = result.items.map((p) => ListingsMapper.toListingResponse(p))
      const totalPages = Math.ceil(result.total / limit)
      return new SearchListingsResponse(items, page, limit, result.total, totalPages)
   }

   static toDetailResponse(detail: ListingDetail): ListingDetailResponse {
      const property = ListingsMapper.toListingResponse(detail.property)
      const reviews = detail.reviews.map((r) => ({
         id: r.id,
         rating: r.rating,
         comment: r.comment,
         createdAt: r.createdAt,
         authorName: r.authorName,
         authorAvatarUrl: r.authorAvatarUrl,
         hostResponse: r.hostResponse
      }))

      return new ListingDetailResponse(property, reviews, detail.averageRating, detail.totalReviews)
   }
}
