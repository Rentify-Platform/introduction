export class BookingResponse {
   constructor(
      public readonly id: string,
      public readonly propertyId: string,
      public readonly guestId: string,
      public readonly hostId: string,
      public readonly status: string,
      public readonly checkIn: string,
      public readonly checkOut: string,
      public readonly guestsCount: number,
      public readonly nightlyRateCents: string,
      public readonly nights: number,
      public readonly cleaningFeeCents: string,
      public readonly serviceFeeCents: string,
      public readonly taxesCents: string,
      public readonly totalPriceCents: string,
      public readonly currency: string,
      public readonly cancellationPolicyCode: string,
      public readonly bookedAt: Date,
      public readonly payment: {
         id: string
         status: string
         amountCents: string
         currency: string
         provider: string
         providerIntentId: string | null
         vaNumber?: string | null
         qrCodeUrl?: string | null
         expiredAt?: Date | null
      } | null,
      public readonly property: {
         id: string
         title: string
         city: string
         countryCode: string
         photoUrls: string[]
      } | null = null
   ) {}
}
