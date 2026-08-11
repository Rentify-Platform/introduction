import { Wishlist } from '../entities/wishlist.entity'
import { WishlistItem } from '../entities/wishlist-item.entity'

export abstract class WishlistRepository {
   abstract findById(id: string): Promise<Wishlist | null>
   abstract findByAccountId(accountId: string): Promise<Wishlist[]>
   abstract save(wishlist: Wishlist): Promise<Wishlist>
   abstract delete(id: string): Promise<void>
   abstract addItem(wishlistId: string, propertyId: string): Promise<WishlistItem>
   abstract removeItem(wishlistId: string, propertyId: string): Promise<void>
   abstract checkPropertyExists(propertyId: string): Promise<boolean>
}
