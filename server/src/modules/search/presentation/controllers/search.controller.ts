import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiResponse } from '../../../../shared/response/api-response'
import {
   SearchListingsUseCase,
   SearchListingsQuery
} from '../../application/use-cases/search-listings.usecase'
import {
   GetListingDetailUseCase,
   GetListingDetailQuery
} from '../../application/use-cases/get-listing-detail.usecase'
import { SearchListingsRequest } from '../requests/search-listings.request'
import { SearchMapper } from '../mappers/search.mapper'

@ApiTags('Search')
@Controller('properties')
export class SearchController {
   constructor(
      private readonly searchListingsUseCase: SearchListingsUseCase,
      private readonly getListingDetailUseCase: GetListingDetailUseCase
   ) {}

   @Get()
   @ApiOperation({ summary: 'Get properties with search & filters (Alias for /properties/search)' })
   async getProperties(@Query() request: SearchListingsRequest) {
      return this.search(request)
   }

   @Get('search')
   @ApiOperation({
      summary: 'Search published listings by query, city, price range, geo radius, amenities'
   })
   async search(@Query() request: SearchListingsRequest) {
      const query = new SearchListingsQuery(
         request.query,
         request.city,
         request.checkIn ? new Date(request.checkIn) : undefined,
         request.checkOut ? new Date(request.checkOut) : undefined,
         request.guests,
         request.minPrice,
         request.maxPrice,
         request.latitude,
         request.longitude,
         request.radiusKm,
         request.roomType,
         request.propertyType,
         request.amenities,
         request.page || 1,
         request.limit || 20,
         request.sortBy
      )

      const result = await this.searchListingsUseCase.execute(query)
      return ApiResponse.success(
         SearchMapper.toSearchResponse(result, query.page, query.limit),
         'Properties searched successfully'
      )
   }

   @Get(':id/detail')
   @ApiOperation({ summary: 'Get listing details and public reviews by property ID' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async getDetail(@Param('id') id: string) {
      const query = new GetListingDetailQuery(id)
      const detail = await this.getListingDetailUseCase.execute(query)
      return ApiResponse.success(
         SearchMapper.toDetailResponse(detail),
         'Listing details with reviews retrieved successfully'
      )
   }
}
