import { Booking } from '../entities/booking.entity'
import { Payment } from '../entities/payment.entity'

export interface FindAllBookingsFilter {
   search?: string
   status?: string
   guestId?: string
   hostId?: string
   propertyId?: string
   page: number
   limit: number
}

export interface PaginatedBookings {
   data: Booking[]
   total: number
   page: number
   limit: number
}

export interface PersonInfo {
   email: string
   firstName: string
   lastName: string
}

export interface AdminBookingListItem {
   booking: Booking
   payment: Payment | null
   guest: PersonInfo | null
   host: PersonInfo | null
   property: { title: string; city: string } | null
}

export interface PaginatedAdminBookings {
   data: AdminBookingListItem[]
   total: number
   page: number
   limit: number
}

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
   abstract findAll(filter: FindAllBookingsFilter): Promise<PaginatedAdminBookings>
   abstract findByIdWithRelations(
      id: string
   ): Promise<{ booking: Booking; payment: Payment | null } | null>
}
