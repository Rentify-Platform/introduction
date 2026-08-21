export type BookingStatus =
   | 'pending'
   | 'pending_approval'
   | 'confirmed'
   | 'cancelled_by_guest'
   | 'cancelled_by_host'
   | 'completed'
   | 'expired'

export interface BookingSummary {
   id: string
   propertyId: string
   guestId: string
   hostId: string
   status: BookingStatus
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
   createdAt: string
   guestName: string | null
   guestEmail: string | null
   hostName: string | null
   hostEmail: string | null
   propertyTitle: string | null
   propertyCity: string | null
}

export interface PaginatedBookings {
   data: BookingSummary[]
   total: number
   page: number
   limit: number
}

export interface BookingsFilter {
   search?: string
   status?: BookingStatus | ''
   page?: number
   limit?: number
}
