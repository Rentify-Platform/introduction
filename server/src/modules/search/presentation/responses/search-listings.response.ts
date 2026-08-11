import { ListingResponse } from '../../../../modules/listings/presentation/responses/listing.response'

export class SearchListingsResponse {
   constructor(
      public readonly items: ListingResponse[],
      public readonly page: number,
      public readonly limit: number,
      public readonly total: number,
      public readonly totalPages: number
   ) {}
}
