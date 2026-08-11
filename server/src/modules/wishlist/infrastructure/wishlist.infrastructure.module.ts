import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { WishlistRepository } from '../domain/repositories/wishlist.repository'
import { WishlistPrismaRepository } from './persistence/wishlist.prisma.repository'

@Module({
   imports: [PrismaModule],
   providers: [
      {
         provide: WishlistRepository,
         useClass: WishlistPrismaRepository
      }
   ],
   exports: [WishlistRepository]
})
export class WishlistInfrastructureModule {}
