import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { KycModule } from './modules/kyc/kyc.module'
import { HostProfileModule } from './modules/host-profile/host-profile.module'
import { ListingsModule } from './modules/listings/listings.module'
import { WishlistModule } from './modules/wishlist/wishlist.module'
import { SearchModule } from './modules/search/search.module'
import { BookingsModule } from './modules/bookings/bookings.module'
import { LedgerModule } from './modules/ledger/ledger.module'
import { GlobalSecurityGuard } from './shared/guards/global-security.guard'
import { MeilisearchModule } from './shared/meilisearch/meilisearch.module'

@Module({
   imports: [
      ScheduleModule.forRoot(),
      PrismaModule,
      MeilisearchModule,
      AuthModule,
      KycModule,
      HostProfileModule,
      SearchModule,
      ListingsModule,
      WishlistModule,
      BookingsModule,
      LedgerModule
   ],
   controllers: [AppController],
   providers: [
      AppService,
      {
         provide: APP_GUARD,
         useClass: GlobalSecurityGuard
      }
   ]
})
export class AppModule {}
