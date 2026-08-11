import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { Property } from '../../../listings/domain/entities/property.entity'
import { BookingResponse } from '../responses/booking.response'
import { PAYMENT_TIMEOUT_SECONDS } from '../../bookings.constants'

export class BookingsMapper {
   static toBookingResponse(
      booking: Booking,
      payment: Payment | null,
      property: Property | null = null
   ): BookingResponse {
      const formattedCheckIn = booking.checkIn.toISOString().split('T')[0]
      const formattedCheckOut = booking.checkOut.toISOString().split('T')[0]

      let vaNumber: string | null = null
      let qrCodeUrl: string | null = null
      if (payment && payment.paymentMethodId) {
         if (payment.paymentMethodId.includes('|')) {
            const parts = payment.paymentMethodId.split('|')
            vaNumber = parts[0]
            qrCodeUrl = parts[1]
         } else {
            vaNumber = payment.paymentMethodId
         }
      }

      const expiredAt = payment
         ? new Date(payment.createdAt.getTime() + PAYMENT_TIMEOUT_SECONDS * 1000)
         : null

      return new BookingResponse(
         booking.id,
         booking.propertyId,
         booking.guestId,
         booking.hostId,
         booking.status,
         formattedCheckIn,
         formattedCheckOut,
         booking.guestsCount,
         booking.nightlyRateCents.toString(),
         booking.nights,
         booking.cleaningFeeCents.toString(),
         booking.serviceFeeCents.toString(),
         booking.taxesCents.toString(),
         booking.totalPriceCents.toString(),
         booking.currency,
         booking.cancellationPolicyCode,
         booking.bookedAt,
         payment
            ? {
                 id: payment.id,
                 status: payment.status,
                 amountCents: payment.amountCents.toString(),
                 currency: payment.currency,
                 provider: payment.provider,
                 providerIntentId: payment.providerIntentId,
                 vaNumber,
                 qrCodeUrl,
                 expiredAt
              }
            : null,
         property
            ? {
                 id: property.id,
                 title: property.title,
                 city: property.city,
                 countryCode: property.countryCode,
                 photoUrls: property.photoUrls
              }
            : null
      )
   }
}
