export interface CancellationOverrideRequest {
   bookingId: string
   overrideReason: string
   guestRefundCents: number
   hostPayoutCents: number
   platformFeeKeptCents: number
}

export interface Cancellation {
   id: string
   bookingId: string
   propertyTitle: string
   guestName: string
   hostName: string
   reason: string
   refundAmountCents?: string
   guestRefundCents?: string
   hostPayoutCents?: string
   platformFeeKeptCents?: string
   overrideReason?: string
   overrideByAdminId?: string
   createdAt: string
}
