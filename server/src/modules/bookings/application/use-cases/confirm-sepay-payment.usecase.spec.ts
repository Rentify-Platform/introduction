import { Booking } from '../../domain/entities/booking.entity'
import { Payment } from '../../domain/entities/payment.entity'
import { BookingsRepository } from '../../domain/repositories/bookings.repository'
import { ListingsRepository } from '../../../listings/domain/repositories/listings.repository'
import { PostTransactionUseCase } from '../../../ledger/application/use-cases/post-transaction.usecase'
import { BookingLockPort } from '../ports/booking-lock.port'
import { BookedDatesCachePort } from '../ports/booked-dates-cache.port'
import {
   ConfirmSepayPaymentCommand,
   ConfirmSepayPaymentUseCase
} from './confirm-sepay-payment.usecase'

const makeBooking = (status: Booking['status']): Booking =>
   new Booking(
      'booking-1',
      'property-1',
      'guest-1',
      'host-1',
      status,
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
      status.startsWith('cancelled') ? new Date('2026-09-01T01:00:00.000Z') : null,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-01T00:00:00.000Z')
   )

const makePayment = (status: Payment['status'] = 'pending'): Payment =>
   new Payment(
      'payment-1',
      'booking-1',
      'va-1',
      null,
      status,
      224000n,
      'VND',
      'sepay',
      'RENTIFY12345678',
      null,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-01T00:00:00.000Z')
   )

const command = () =>
   new ConfirmSepayPaymentCommand(2240, 'RENTIFY12345678', 'SePay', '2026-09-01T02:00:00Z', 'ref-1')

describe('ConfirmSepayPaymentUseCase', () => {
   it('captures a payment for a pending booking', async () => {
      const savePayment = jest.fn()
      const saveBooking = jest.fn()
      const postTransaction = jest.fn().mockResolvedValue({ id: 'ledger-1' })
      const bookingsRepository = {
         findPaymentByIntentId: jest.fn().mockResolvedValue(makePayment()),
         findById: jest.fn().mockResolvedValue(makeBooking('pending')),
         savePayment,
         save: saveBooking,
         checkOverlappingBooking: jest.fn()
      }
      const useCase = new ConfirmSepayPaymentUseCase(
         bookingsRepository as unknown as BookingsRepository,
         {
            findById: jest.fn().mockResolvedValue({ instantBook: true })
         } as unknown as ListingsRepository,
         { execute: postTransaction } as unknown as PostTransactionUseCase,
         { releaseLock: jest.fn() } as unknown as BookingLockPort,
         { invalidate: jest.fn() } as unknown as BookedDatesCachePort
      )

      const result = await useCase.execute(command())

      expect(result.success).toBe(true)
      expect(postTransaction).toHaveBeenCalledTimes(1)
      expect(savePayment).toHaveBeenCalledWith(expect.objectContaining({ status: 'captured' }))
      expect(saveBooking).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed' }))
   })

   it.each(['cancelled_by_guest', 'cancelled_by_host', 'cancelled_by_admin', 'expired'] as const)(
      'rejects a late payment for %s without ledger or booking updates',
      async (status) => {
         const savePayment = jest.fn()
         const postTransaction = jest.fn()
         const saveBooking = jest.fn()
         const bookingsRepository = {
            findPaymentByIntentId: jest.fn().mockResolvedValue(makePayment()),
            findById: jest.fn().mockResolvedValue(makeBooking(status)),
            savePayment,
            save: saveBooking,
            checkOverlappingBooking: jest.fn()
         }
         const useCase = new ConfirmSepayPaymentUseCase(
            bookingsRepository as unknown as BookingsRepository,
            { findById: jest.fn() } as unknown as ListingsRepository,
            { execute: postTransaction } as unknown as PostTransactionUseCase,
            { releaseLock: jest.fn() } as unknown as BookingLockPort,
            { invalidate: jest.fn() } as unknown as BookedDatesCachePort
         )

         const result = await useCase.execute(command())

         expect(result.success).toBe(true)
         expect(savePayment).toHaveBeenCalledWith(
            expect.objectContaining({
               status: 'failed',
               failureReason: expect.stringContaining(`booking was ${status}`)
            })
         )
         expect(postTransaction).not.toHaveBeenCalled()
         expect(saveBooking).not.toHaveBeenCalled()
      }
   )

   it('treats a repeated failed webhook as idempotent', async () => {
      const failedPayment = makePayment('failed')
      const findPaymentByIntentId = jest
         .fn()
         .mockResolvedValueOnce(makePayment())
         .mockResolvedValueOnce(failedPayment)
      const savePayment = jest.fn()
      const bookingsRepository = {
         findPaymentByIntentId,
         findById: jest.fn().mockResolvedValue(makeBooking('expired')),
         savePayment,
         save: jest.fn(),
         checkOverlappingBooking: jest.fn()
      }
      const useCase = new ConfirmSepayPaymentUseCase(
         bookingsRepository as unknown as BookingsRepository,
         { findById: jest.fn() } as unknown as ListingsRepository,
         { execute: jest.fn() } as unknown as PostTransactionUseCase,
         { releaseLock: jest.fn() } as unknown as BookingLockPort,
         { invalidate: jest.fn() } as unknown as BookedDatesCachePort
      )

      await useCase.execute(command())
      const retryResult = await useCase.execute(command())

      expect(retryResult.success).toBe(true)
      expect(savePayment).toHaveBeenCalledTimes(1)
   })
})
