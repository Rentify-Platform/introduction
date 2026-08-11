import { Injectable } from '@nestjs/common'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import {
   WishlistNotFoundException,
   UnauthorizedWishlistAccessException
} from '../../domain/errors/wishlist.errors'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

export class GetWishlistDetailsCommand {
   constructor(
      public readonly wishlistId: string,
      public readonly accountId: string
   ) {}
}

@Injectable()
export class GetWishlistDetailsUseCase {
   constructor(private readonly wishlistRepository: WishlistRepository) {}

   async execute(command: GetWishlistDetailsCommand): Promise<Wishlist> {
      const wishlist = await this.wishlistRepository.findById(command.wishlistId)
      if (!wishlist) {
         throw new WishlistNotFoundException()
      }

      if (wishlist.accountId !== command.accountId) {
         throw new UnauthorizedWishlistAccessException()
      }

      return wishlist
   }
}
