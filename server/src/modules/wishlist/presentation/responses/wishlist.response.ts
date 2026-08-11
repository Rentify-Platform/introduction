import { WishlistItemResponse } from './wishlist-item.response'

export class WishlistResponse {
   constructor(
      public readonly id: string,
      public readonly accountId: string,
      public readonly name: string,
      public readonly createdAt: Date,
      public readonly items: WishlistItemResponse[]
   ) {}
}
