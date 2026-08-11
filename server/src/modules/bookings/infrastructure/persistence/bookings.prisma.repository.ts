import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { Booking, BookingStatus } from '../../domain/entities/booking.entity'
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { booking_status, payment_status } from '@prisma/client'

@Injectable()
export class BookingsPrismaRepository implements BookingsRepository {
   constructor(private readonly prisma: PrismaService) {}

   private mapToBookingEntity(record: any): Booking {
      return new Booking(
         record.id,
         record.property_id,
         record.guest_id,
         record.host_id,
         record.status as BookingStatus,
         record.check_in,
         record.check_out,
         record.guests_count,
         record.nightly_rate_cents,
         record.nights,
         record.cleaning_fee_cents,
         record.service_fee_cents,
         record.taxes_cents,
         record.total_price_cents,
         record.currency,
         record.cancellation_policy_code,
         record.booked_at,
         record.cancelled_at,
         record.created_at,
         record.updated_at
      )
   }

   private mapToPaymentEntity(record: any): Payment {
      return new Payment(
         record.id,
         record.booking_id,
         record.payment_method_id,
         record.ledger_transaction_id,
         record.status as PaymentStatus,
         record.amount_cents,
         record.currency,
         record.provider,
         record.provider_intent_id,
         record.failure_reason,
         record.created_at,
         record.updated_at
      )
   }

   async findById(id: string): Promise<Booking | null> {
      const record = await this.prisma.bookings.findUnique({
         where: { id }
      })
      if (!record) return null
      return this.mapToBookingEntity(record)
   }

   async save(booking: Booking): Promise<Booking> {
      const record = await this.prisma.bookings.upsert({
         where: { id: booking.id },
         update: {
            status: booking.status as booking_status,
            cancelled_at: booking.cancelledAt,
            updated_at: booking.updatedAt
         },
         create: {
            id: booking.id,
            property_id: booking.propertyId,
            guest_id: booking.guestId,
            host_id: booking.hostId,
            status: booking.status as booking_status,
            check_in: booking.checkIn,
            check_out: booking.checkOut,
            guests_count: booking.guestsCount,
            nightly_rate_cents: booking.nightlyRateCents,
            cleaning_fee_cents: booking.cleaningFeeCents,
            service_fee_cents: booking.serviceFeeCents,
            taxes_cents: booking.taxesCents,
            total_price_cents: booking.totalPriceCents,
            currency: booking.currency,
            cancellation_policy_code: booking.cancellationPolicyCode,
            booked_at: booking.bookedAt,
            cancelled_at: booking.cancelledAt,
            created_at: booking.createdAt,
            updated_at: booking.updatedAt
         }
      })
      return this.mapToBookingEntity(record)
   }

   async checkOverlappingBooking(
      propertyId: string,
      checkIn: Date,
      checkOut: Date
   ): Promise<boolean> {
      const count = await this.prisma.bookings.count({
         where: {
            property_id: propertyId,
            status: {
               notIn: [
                  booking_status.cancelled_by_guest,
                  booking_status.cancelled_by_host,
                  booking_status.expired
               ]
            },
            check_in: { lt: checkOut },
            check_out: { gt: checkIn }
         }
      })
      return count > 0
   }

   async findPaymentById(id: string): Promise<Payment | null> {
      const record = await this.prisma.payments.findUnique({
         where: { id }
      })
      if (!record) return null
      return this.mapToPaymentEntity(record)
   }

   async findPaymentByBookingId(bookingId: string): Promise<Payment | null> {
      const record = await this.prisma.payments.findFirst({
         where: { booking_id: bookingId }
      })
      if (!record) return null
      return this.mapToPaymentEntity(record)
   }

   async findPaymentByIntentId(provider: string, intentId: string): Promise<Payment | null> {
      const record = await this.prisma.payments.findUnique({
         where: {
            provider_provider_intent_id: {
               provider,
               provider_intent_id: intentId
            }
         }
      })
      if (!record) return null
      return this.mapToPaymentEntity(record)
   }

   async savePayment(payment: Payment): Promise<Payment> {
      const record = await this.prisma.payments.upsert({
         where: { id: payment.id },
         update: {
            status: payment.status as payment_status,
            failure_reason: payment.failureReason,
            updated_at: payment.updatedAt
         },
         create: {
            id: payment.id,
            booking_id: payment.bookingId,
            payment_method_id: payment.paymentMethodId,
            ledger_transaction_id: payment.ledgerTransactionId,
            status: payment.status as payment_status,
            amount_cents: payment.amountCents,
            currency: payment.currency,
            provider: payment.provider,
            provider_intent_id: payment.providerIntentId,
            failure_reason: payment.failureReason,
            created_at: payment.createdAt,
            updated_at: payment.updatedAt
         }
      })
      return this.mapToPaymentEntity(record)
   }

   async findManyByGuestId(guestId: string): Promise<Booking[]> {
      const records = await this.prisma.bookings.findMany({
         where: { guest_id: guestId },
         orderBy: { created_at: 'desc' }
      })
      return records.map((r) => this.mapToBookingEntity(r))
   }

   async findManyByHostId(hostId: string): Promise<Booking[]> {
      const records = await this.prisma.bookings.findMany({
         where: { host_id: hostId },
         orderBy: { created_at: 'desc' }
      })
      return records.map((r) => this.mapToBookingEntity(r))
   }

   async findActiveBookingsByPropertyId(propertyId: string): Promise<Booking[]> {
      const records = await this.prisma.bookings.findMany({
         where: {
            property_id: propertyId,
            status: {
               notIn: [
                  booking_status.cancelled_by_guest,
                  booking_status.cancelled_by_host,
                  booking_status.expired
               ]
            }
         }
      })
      return records.map((r) => this.mapToBookingEntity(r))
   }
}
