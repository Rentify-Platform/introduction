import { Injectable } from '@nestjs/common'
import { SearchRepository, SearchResult } from '../../domain/repositories/search.repository'

export class SearchListingsQuery {
   constructor(
      public readonly query?: string,
      public readonly city?: string,
      public readonly checkIn?: Date,
      public readonly checkOut?: Date,
      public readonly guests?: number,
      public readonly minPrice?: number,
      public readonly maxPrice?: number,
      public readonly latitude?: number,
      public readonly longitude?: number,
      public readonly radiusKm?: number,
      public readonly roomType?: string,
      public readonly propertyType?: string,
      public readonly amenities?: string[],
      public readonly page: number = 1,
      public readonly limit: number = 20,
      public readonly sortBy?: string
   ) {}
}

@Injectable()
export class SearchListingsUseCase {
   constructor(private readonly searchRepository: SearchRepository) {}

   async execute(query: SearchListingsQuery): Promise<SearchResult> {
      return this.searchRepository.search({
         query: query.query,
         city: query.city,
         checkIn: query.checkIn,
         checkOut: query.checkOut,
         guests: query.guests,
         minPrice: query.minPrice,
         maxPrice: query.maxPrice,
         latitude: query.latitude,
         longitude: query.longitude,
         radiusKm: query.radiusKm,
         roomType: query.roomType,
         propertyType: query.propertyType,
         amenities: query.amenities,
         page: query.page,
         limit: query.limit,
         sortBy: query.sortBy
      })
   }
}
