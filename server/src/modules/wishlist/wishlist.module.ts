import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { WishlistInfrastructureModule } from './infrastructure/wishlist.infrastructure.module'
import { WishlistController } from './presentation/controllers/wishlist.controller'
import { CreateWishlistUseCase } from './application/use-cases/create-wishlist.usecase'
import { AddWishlistItemUseCase } from './application/use-cases/add-wishlist-item.usecase'
import { RemoveWishlistItemUseCase } from './application/use-cases/remove-wishlist-item.usecase'
import { GetUserWishlistsUseCase } from './application/use-cases/get-user-wishlists.usecase'
import { GetWishlistDetailsUseCase } from './application/use-cases/get-wishlist-details.usecase'

@Module({
   imports: [WishlistInfrastructureModule, AuthModule],
   controllers: [WishlistController],
   providers: [
      CreateWishlistUseCase,
      AddWishlistItemUseCase,
      RemoveWishlistItemUseCase,
      GetUserWishlistsUseCase,
      GetWishlistDetailsUseCase
   ],
   exports: [
      CreateWishlistUseCase,
      AddWishlistItemUseCase,
      RemoveWishlistItemUseCase,
      GetUserWishlistsUseCase,
      GetWishlistDetailsUseCase,
      WishlistInfrastructureModule
   ]
})
export class WishlistModule {}
