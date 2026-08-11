import { Booking } from '../entities/booking.entity'
import { Payment } from '../entities/payment.entity'

export abstract class BookingsRepository {
   abstract findById(id: string): Promise<Booking | null>
   abstract save(booking: Booking): Promise<Booking>
   abstract checkOverlappingBooking(
      propertyId: string,
      checkIn: Date,
      checkOut: Date
   ): Promise<boolean>

   abstract findPaymentById(id: string): Promise<Payment | null>
   abstract findPaymentByBookingId(bookingId: string): Promise<Payment | null>
   abstract findPaymentByIntentId(provider: string, intentId: string): Promise<Payment | null>
   abstract savePayment(payment: Payment): Promise<Payment>

   abstract findManyByGuestId(guestId: string): Promise<Booking[]>
   abstract findManyByHostId(hostId: string): Promise<Booking[]>
   abstract findActiveBookingsByPropertyId(propertyId: string): Promise<Booking[]>
}
