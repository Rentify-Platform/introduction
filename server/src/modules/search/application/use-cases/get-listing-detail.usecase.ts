import { Injectable } from '@nestjs/common'
import { SearchRepository, ListingDetail } from '../../domain/repositories/search.repository'
import { PropertyNotFoundException } from '../../domain/errors/search.errors'

export class GetListingDetailQuery {
   constructor(public readonly propertyId: string) {}
}

@Injectable()
export class GetListingDetailUseCase {
   constructor(private readonly searchRepository: SearchRepository) {}

   async execute(query: GetListingDetailQuery): Promise<ListingDetail> {
      const detail = await this.searchRepository.findListingDetail(query.propertyId)
      if (!detail) {
         throw new PropertyNotFoundException()
      }
      return detail
   }
}
