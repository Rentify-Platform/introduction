import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   CreateWishlistCommand,
   CreateWishlistUseCase
} from '../../application/use-cases/create-wishlist.usecase'
import {
   AddWishlistItemCommand,
   AddWishlistItemUseCase
} from '../../application/use-cases/add-wishlist-item.usecase'
import {
   RemoveWishlistItemCommand,
   RemoveWishlistItemUseCase
} from '../../application/use-cases/remove-wishlist-item.usecase'
import {
   GetUserWishlistsCommand,
   GetUserWishlistsUseCase
} from '../../application/use-cases/get-user-wishlists.usecase'
import {
   GetWishlistDetailsCommand,
   GetWishlistDetailsUseCase
} from '../../application/use-cases/get-wishlist-details.usecase'
import { CreateWishlistRequest } from '../requests/create-wishlist.request'
import { WishlistMapper } from '../mappers/wishlist.mapper'

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistController {
   constructor(
      private readonly createWishlistUseCase: CreateWishlistUseCase,
      private readonly addWishlistItemUseCase: AddWishlistItemUseCase,
      private readonly removeWishlistItemUseCase: RemoveWishlistItemUseCase,
      private readonly getUserWishlistsUseCase: GetUserWishlistsUseCase,
      private readonly getWishlistDetailsUseCase: GetWishlistDetailsUseCase
   ) {}

   @Post()
   async create(@CurrentUser() user: AuthenticatedUser, @Body() request: CreateWishlistRequest) {
      const command = new CreateWishlistCommand(user.id, request.name)
      const wishlist = await this.createWishlistUseCase.execute(command)
      return ApiResponse.success(
         WishlistMapper.toWishlistResponse(wishlist),
         'Wishlist created successfully'
      )
   }

   @Get()
   async getMine(@CurrentUser() user: AuthenticatedUser) {
      const command = new GetUserWishlistsCommand(user.id)
      const wishlists = await this.getUserWishlistsUseCase.execute(command)
      const mapped = wishlists.map((w) => WishlistMapper.toWishlistResponse(w))
      return ApiResponse.success(mapped, 'Wishlists retrieved successfully')
   }

   @Get(':id')
   async getDetails(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new GetWishlistDetailsCommand(id, user.id)
      const wishlist = await this.getWishlistDetailsUseCase.execute(command)
      return ApiResponse.success(
         WishlistMapper.toWishlistResponse(wishlist),
         'Wishlist details retrieved successfully'
      )
   }

   @Post(':id/properties/:propertyId')
   async addItem(
      @Param('id') id: string,
      @Param('propertyId') propertyId: string,
      @CurrentUser() user: AuthenticatedUser
   ) {
      const command = new AddWishlistItemCommand(id, user.id, propertyId)
      const wishlist = await this.addWishlistItemUseCase.execute(command)
      return ApiResponse.success(
         WishlistMapper.toWishlistResponse(wishlist),
         'Property added to wishlist successfully'
      )
   }

   @Delete(':id/properties/:propertyId')
   async removeItem(
      @Param('id') id: string,
      @Param('propertyId') propertyId: string,
      @CurrentUser() user: AuthenticatedUser
   ) {
      const command = new RemoveWishlistItemCommand(id, user.id, propertyId)
      const wishlist = await this.removeWishlistItemUseCase.execute(command)
      return ApiResponse.success(
         WishlistMapper.toWishlistResponse(wishlist),
         'Property removed from wishlist successfully'
      )
   }
}
