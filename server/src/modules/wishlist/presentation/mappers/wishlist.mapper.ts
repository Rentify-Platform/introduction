import { Wishlist } from '../../domain/entities/wishlist.entity'
import { WishlistItem } from '../../domain/entities/wishlist-item.entity'
import { WishlistResponse } from '../responses/wishlist.response'
import { WishlistItemResponse } from '../responses/wishlist-item.response'

export class WishlistMapper {
   static toWishlistItemResponse(item: WishlistItem): WishlistItemResponse {
      return new WishlistItemResponse(
         item.wishlistId,
         item.propertyId,
         item.propertyTitle,
         item.propertyPriceCents?.toString(),
         item.propertyPhotoUrl
      )
   }

   static toWishlistResponse(wishlist: Wishlist): WishlistResponse {
      const items = wishlist.items.map((item) => this.toWishlistItemResponse(item))
      return new WishlistResponse(
         wishlist.id,
         wishlist.accountId,
         wishlist.name,
         wishlist.createdAt,
         items
      )
   }
}
