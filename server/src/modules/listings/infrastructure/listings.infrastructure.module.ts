import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { ListingsRepository } from '../domain/repositories/listings.repository'
import { ListingsPrismaRepository } from './persistence/listings.prisma.repository'

@Module({
   imports: [PrismaModule],
   providers: [
      {
         provide: ListingsRepository,
         useClass: ListingsPrismaRepository
      }
   ],
   exports: [ListingsRepository]
})
export class ListingsInfrastructureModule {}
