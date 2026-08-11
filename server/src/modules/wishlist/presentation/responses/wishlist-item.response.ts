export class WishlistItemResponse {
   constructor(
      public readonly wishlistId: string,
      public readonly propertyId: string,
      public readonly propertyTitle?: string,
      public readonly propertyPriceCents?: string,
      public readonly propertyPhotoUrl?: string | null
   ) {}
}
