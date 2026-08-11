import { randomUUID } from 'crypto'

export type BookingStatus =
   | 'pending'
   | 'pending_approval'
   | 'confirmed'
   | 'cancelled_by_guest'
   | 'cancelled_by_host'
   | 'completed'
   | 'expired'

export class Booking {
   constructor(
      public readonly id: string,
      public readonly propertyId: string,
      public readonly guestId: string,
      public readonly hostId: string,
      public readonly status: BookingStatus,
      public readonly checkIn: Date,
      public readonly checkOut: Date,
      public readonly guestsCount: number,
      public readonly nightlyRateCents: bigint,
      public readonly nights: number,
      public readonly cleaningFeeCents: bigint,
      public readonly serviceFeeCents: bigint,
      public readonly taxesCents: bigint,
      public readonly totalPriceCents: bigint,
      public readonly currency: string,
      public readonly cancellationPolicyCode: string,
      public readonly bookedAt: Date,
      public readonly cancelledAt: Date | null,
      public readonly createdAt: Date,
      public readonly updatedAt: Date
   ) {}

   static create(params: {
      propertyId: string
      guestId: string
      hostId: string
      checkIn: Date
      checkOut: Date
      guestsCount: number
      nightlyRateCents: bigint
      cleaningFeeCents: bigint
      cancellationPolicyCode: string
      currency?: string
   }): Booking {
      const msPerDay = 1000 * 60 * 60 * 24
      const nights = Math.max(
         1,
         Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / msPerDay)
      )

      const nightlyTotal = params.nightlyRateCents * BigInt(nights)
      // Service fee is 12%
      const serviceFeeCents = (nightlyTotal * 12n) / 100n
      const taxesCents = 0n // for now
      const totalPriceCents = nightlyTotal + params.cleaningFeeCents + serviceFeeCents + taxesCents

      return new Booking(
         randomUUID(),
         params.propertyId,
         params.guestId,
         params.hostId,
         'pending',
         params.checkIn,
         params.checkOut,
         params.guestsCount,
         params.nightlyRateCents,
         nights,
         params.cleaningFeeCents,
         serviceFeeCents,
         taxesCents,
         totalPriceCents,
         params.currency || 'VND',
         params.cancellationPolicyCode,
         new Date(),
         null,
         new Date(),
         new Date()
      )
   }
}
