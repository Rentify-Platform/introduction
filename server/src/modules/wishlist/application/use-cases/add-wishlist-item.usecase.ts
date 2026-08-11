import { Injectable } from '@nestjs/common'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import {
   WishlistNotFoundException,
   UnauthorizedWishlistAccessException
} from '../../domain/errors/wishlist.errors'
import { PropertyNotFoundException } from '../../../listings/domain/errors/listings.errors'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

export class AddWishlistItemCommand {
   constructor(
      public readonly wishlistId: string,
      public readonly accountId: string,
      public readonly propertyId: string
   ) {}
}

@Injectable()
export class AddWishlistItemUseCase {
   constructor(private readonly wishlistRepository: WishlistRepository) {}

   async execute(command: AddWishlistItemCommand): Promise<Wishlist> {
      // 1. Load Wishlist
      const wishlist = await this.wishlistRepository.findById(command.wishlistId)
      if (!wishlist) {
         throw new WishlistNotFoundException()
      }

      // 2. Validate Ownership
      if (wishlist.accountId !== command.accountId) {
         throw new UnauthorizedWishlistAccessException()
      }

      // 3. Verify Property exists
      const propertyExists = await this.wishlistRepository.checkPropertyExists(command.propertyId)
      if (!propertyExists) {
         throw new PropertyNotFoundException()
      }

      // 4. Validate duplicate addition in domain
      wishlist.addItem(command.propertyId)

      // 5. Persist the link
      await this.wishlistRepository.addItem(command.wishlistId, command.propertyId)

      // 6. Return reloaded wishlist
      const reloaded = await this.wishlistRepository.findById(command.wishlistId)
      if (!reloaded) {
         throw new WishlistNotFoundException()
      }
      return reloaded
   }
}
