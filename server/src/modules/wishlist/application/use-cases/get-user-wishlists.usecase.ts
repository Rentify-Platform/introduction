import { Injectable } from '@nestjs/common'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

export class GetUserWishlistsCommand {
   constructor(public readonly accountId: string) {}
}

@Injectable()
export class GetUserWishlistsUseCase {
   constructor(private readonly wishlistRepository: WishlistRepository) {}

   async execute(command: GetUserWishlistsCommand): Promise<Wishlist[]> {
      return this.wishlistRepository.findByAccountId(command.accountId)
   }
}
