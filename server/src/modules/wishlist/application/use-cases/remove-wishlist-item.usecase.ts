import { Injectable } from '@nestjs/common'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import {
   WishlistNotFoundException,
   UnauthorizedWishlistAccessException
} from '../../domain/errors/wishlist.errors'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

export class RemoveWishlistItemCommand {
   constructor(
      public readonly wishlistId: string,
      public readonly accountId: string,
      public readonly propertyId: string
   ) {}
}

@Injectable()
export class RemoveWishlistItemUseCase {
   constructor(private readonly wishlistRepository: WishlistRepository) {}

   async execute(command: RemoveWishlistItemCommand): Promise<Wishlist> {
      // 1. Fetch wishlist
      const wishlist = await this.wishlistRepository.findById(command.wishlistId)
      if (!wishlist) {
         throw new WishlistNotFoundException()
      }

      // 2. Validate Ownership
      if (wishlist.accountId !== command.accountId) {
         throw new UnauthorizedWishlistAccessException()
      }

      // 3. Validate existence of item in domain
      wishlist.removeItem(command.propertyId)

      // 4. Persist removal
      await this.wishlistRepository.removeItem(command.wishlistId, command.propertyId)

      // 5. Return reloaded wishlist
      const reloaded = await this.wishlistRepository.findById(command.wishlistId)
      if (!reloaded) {
         throw new WishlistNotFoundException()
      }
      return reloaded
   }
}
