import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { MeilisearchModule } from '../../shared/meilisearch/meilisearch.module'
import { SearchController } from './presentation/controllers/search.controller'
import { SearchRepository } from './domain/repositories/search.repository'
import { SearchPrismaRepository } from './infrastructure/persistence/search.prisma.repository'
import { SearchListingsUseCase } from './application/use-cases/search-listings.usecase'
import { GetListingDetailUseCase } from './application/use-cases/get-listing-detail.usecase'

@Module({
   imports: [PrismaModule, MeilisearchModule],
   controllers: [SearchController],
   providers: [
      SearchListingsUseCase,
      GetListingDetailUseCase,
      {
         provide: SearchRepository,
         useClass: SearchPrismaRepository
      }
   ],
   exports: [SearchListingsUseCase, GetListingDetailUseCase, SearchRepository]
})
export class SearchModule {}
