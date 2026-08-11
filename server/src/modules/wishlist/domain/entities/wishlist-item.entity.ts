export class WishlistItem {
   constructor(
      public readonly wishlistId: string,
      public readonly propertyId: string,
      public readonly propertyTitle?: string,
      public readonly propertyPriceCents?: bigint,
      public readonly propertyPhotoUrl?: string | null
   ) {}

   static create(wishlistId: string, propertyId: string): WishlistItem {
      return new WishlistItem(wishlistId, propertyId)
   }
}
