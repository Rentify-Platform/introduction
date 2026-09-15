import { Booking } from '../../domain/entities/booking.entity'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { PrismaService } from '../../../../prisma/prisma.service'
import { PostTransactionUseCase } from '../../../ledger/application/use-cases/post-transaction.usecase'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'
import { CancelBookingCommand, CancelBookingUseCase } from './cancel-booking.usecase'

const makeBooking = (): Booking =>
   new Booking(
      'booking-1',
      'property-1',
      'guest-1',
      'host-1',
      'confirmed',
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-03T00:00:00.000Z'),
      2,
      100000n,
      2,
      0n,
      24000n,
      0n,
      224000n,
      'VND',
      'moderate',
      new Date('2026-09-01T00:00:00.000Z'),
      null,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-01T00:00:00.000Z')
   )

describe('CancelBookingUseCase', () => {
   it.each([
      ['admin', 'admin-1', 'admin', 'cancelled_by_admin'],
      ['guest', 'guest-1', 'guest', 'cancelled_by_guest'],
      ['host', 'host-1', 'host', 'cancelled_by_host']
   ] as const)(
      'maps %s cancellation to its own booking status',
      async (_label, userId, auditRole, expectedStatus) => {
         const cancellationCreate = jest.fn()
         const bookingUpdate = jest.fn()
         const prisma = {
            $transaction: jest.fn(
               async (
                  callback: (tx: {
                     cancellations: { create: jest.Mock }
                     bookings: { update: jest.Mock }
                  }) => Promise<Booking>
               ) =>
                  callback({
                     cancellations: { create: cancellationCreate },
                     bookings: { update: bookingUpdate }
                  })
            )
         }
         const bookingsRepository = {
            findById: jest.fn().mockResolvedValue(makeBooking()),
            findPaymentByBookingId: jest.fn().mockResolvedValue(null)
         }
         const postTransactionUseCase = { execute: jest.fn() }
         const bookedDatesCachePort = { invalidate: jest.fn().mockResolvedValue(undefined) }
         const useCase = new CancelBookingUseCase(
            bookingsRepository as unknown as BookingsRepository,
            prisma as unknown as PrismaService,
            postTransactionUseCase as unknown as PostTransactionUseCase,
            bookedDatesCachePort as unknown as BookedDatesCachePort
         )

         const result = await useCase.execute(
            new CancelBookingCommand('booking-1', userId, auditRole, 'policy reason')
         )

         expect(result.booking.status).toBe(expectedStatus)
         expect(cancellationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
               data: expect.objectContaining({ cancelled_by_role: auditRole })
            })
         )
         expect(bookingUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
               data: expect.objectContaining({ status: expectedStatus })
            })
         )
      }
   )
})
