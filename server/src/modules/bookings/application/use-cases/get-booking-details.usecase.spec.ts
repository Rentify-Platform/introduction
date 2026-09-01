import { NotFoundException } from '@nestjs/common'
import { GetBookingDetailsCommand, GetBookingDetailsUseCase } from './get-booking-details.usecase'
import { Booking } from '../../domain/entities/booking.entity'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'

const makeBooking = (overrides: Partial<Booking> = {}): Booking =>
   new Booking(
      overrides.id ?? 'booking-1',
      overrides.propertyId ?? 'property-1',
      overrides.guestId ?? 'guest-1',
      overrides.hostId ?? 'host-1',
      overrides.status ?? 'confirmed',
      overrides.checkIn ?? new Date('2026-10-01T00:00:00.000Z'),
      overrides.checkOut ?? new Date('2026-10-03T00:00:00.000Z'),
      overrides.guestsCount ?? 2,
      overrides.nightlyRateCents ?? 100000n,
      overrides.nights ?? 2,
      overrides.cleaningFeeCents ?? 0n,
      overrides.serviceFeeCents ?? 24000n,
      overrides.taxesCents ?? 0n,
      overrides.totalPriceCents ?? 224000n,
      overrides.currency ?? 'VND',
      overrides.cancellationPolicyCode ?? 'moderate',
      overrides.bookedAt ?? new Date('2026-09-01T00:00:00.000Z'),
      overrides.cancelledAt ?? null,
      overrides.createdAt ?? new Date('2026-09-01T00:00:00.000Z'),
      overrides.updatedAt ?? new Date('2026-09-01T00:00:00.000Z')
   )

describe('GetBookingDetailsUseCase', () => {
   const booking = makeBooking()
   let bookingsRepository: { findById: jest.Mock; findPaymentByBookingId: jest.Mock }
   let listingsRepository: { findById: jest.Mock }
   let useCase: GetBookingDetailsUseCase

   beforeEach(() => {
      bookingsRepository = {
         findById: jest.fn().mockResolvedValue(booking),
         findPaymentByBookingId: jest.fn().mockResolvedValue(null)
      }
      listingsRepository = { findById: jest.fn().mockResolvedValue(null) }
      useCase = new GetBookingDetailsUseCase(
         bookingsRepository as unknown as BookingsRepository,
         listingsRepository as unknown as ListingsRepository
      )
   })

   it.each([
      ['guest', 'guest-1'],
      ['host', 'host-1'],
      ['admin', 'unrelated-admin']
   ])('allows %s to view an authorized booking', async (role, userId) => {
      const result = await useCase.execute(new GetBookingDetailsCommand('booking-1', userId, role))

      expect(result.booking).toBe(booking)
      expect(bookingsRepository.findPaymentByBookingId).toHaveBeenCalledWith('booking-1')
   })

   it.each([
      ['guest', 'guest-2'],
      ['host', 'host-2'],
      ['user', 'unrelated-user']
   ])('returns 404 for an unrelated %s', async (role, userId) => {
      await expect(
         useCase.execute(new GetBookingDetailsCommand('booking-1', userId, role))
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(bookingsRepository.findPaymentByBookingId).not.toHaveBeenCalled()
   })

   it('returns 404 when the booking does not exist', async () => {
      bookingsRepository.findById.mockResolvedValue(null)

      await expect(
         useCase.execute(new GetBookingDetailsCommand('missing', 'guest-1', 'guest'))
      ).rejects.toBeInstanceOf(NotFoundException)
   })
})
