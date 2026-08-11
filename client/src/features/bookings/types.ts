export interface BookingInput {
   propertyId: string
   checkIn: string
   checkOut: string
   guestsCount: number
}

export interface PaymentDetails {
   id: string
   status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed'
   amountCents: string
   currency: string
   provider: string
   providerIntentId: string | null
   vaNumber?: string | null
   qrCodeUrl?: string | null
   expiredAt?: string | null
}

export interface Booking {
   id: string
   propertyId: string
   guestId: string
   hostId: string
   status:
      | 'pending'
      | 'pending_approval'
      | 'confirmed'
      | 'cancelled_by_guest'
      | 'cancelled_by_host'
      | 'completed'
      | 'expired'
   checkIn: string
   checkOut: string
   guestsCount: number
   nightlyRateCents: string
   nights: number
   cleaningFeeCents: string
   serviceFeeCents: string
   taxesCents: string
   totalPriceCents: string
   currency: string
   cancellationPolicyCode: string
   bookedAt: string
   payment: PaymentDetails | null
   property: {
      id: string
      title: string
      city: string
      countryCode: string
      photoUrls: string[]
   } | null
}
