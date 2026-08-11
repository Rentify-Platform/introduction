import { Injectable } from '@nestjs/common'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

export class CreateWishlistCommand {
   constructor(
      public readonly accountId: string,
      public readonly name: string
   ) {}
}

@Injectable()
export class CreateWishlistUseCase {
   constructor(private readonly wishlistRepository: WishlistRepository) {}

   async execute(command: CreateWishlistCommand): Promise<Wishlist> {
      const wishlist = Wishlist.create(command.accountId, command.name)
      return this.wishlistRepository.save(wishlist)
   }
}
