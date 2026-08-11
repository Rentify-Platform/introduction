export interface WishlistItem {
   wishlistId: string
   propertyId: string
   propertyTitle: string
   propertyPriceCents?: string
   propertyPhotoUrl?: string | null
}

export interface Wishlist {
   id: string
   accountId: string
   name: string
   createdAt: string
   items: WishlistItem[]
}

export interface CreateWishlistInput {
   name: string
}
