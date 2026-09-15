import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { PostTransactionUseCase } from '../../../ledger/application/use-cases/post-transaction.usecase'
import { LedgerRepository } from '../../../ledger/domain/repositories/ledger.repository'
import { LedgerAccount } from '../../../ledger/domain/entities/ledger-account.entity'
import { LedgerTransaction } from '../../../ledger/domain/entities/ledger-transaction.entity'
import {
   AdminOverrideCancellationCommand,
   AdminOverrideCancellationUseCase
} from './admin-override-cancellation.usecase'

const TOTAL_CENTS = 3000000n

const makeBooking = (cancellation: Record<string, unknown>) => ({
   id: 'booking-1',
   guest_id: 'guest-1',
   host_id: 'host-1',
   status: 'cancelled_by_guest',
   total_price_cents: TOTAL_CENTS,
   currency: 'VND',
   cancellations: [cancellation]
})

const makeCancellation = (overrides: Record<string, unknown> = {}) => ({
   id: 'cancellation-1',
   guest_refund_cents: TOTAL_CENTS,
   host_payout_cents: 0n,
   platform_fee_kept_cents: 0n,
   ledger_transaction_id: 'refund-txn-1',
   ...overrides
})

// In-memory ledger repository so the real PostTransactionUseCase (including its
// idempotency dedup) is exercised against the override use case.
class InMemoryLedgerRepository {
   public accounts = new Map<string, LedgerAccount>()
   public savedTransactions: LedgerTransaction[] = []

   findTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null> {
      const found = this.savedTransactions.find((txn) => txn.idempotencyKey === key) ?? null
      return Promise.resolve(found)
   }

   getOrCreateAccount(
      ownerType: 'platform' | 'guest' | 'host',
      ownerAccountId: string | null,
      accountSubtype: string
   ): Promise<LedgerAccount> {
      const key = `${ownerType}:${ownerAccountId ?? '-'}:${accountSubtype}`
      const existing = this.accounts.get(key)
      if (existing) return Promise.resolve(existing)
      const account = LedgerAccount.create({
         ownerType,
         ownerAccountId,
         accountSubtype,
         currency: 'VND'
      })
      this.accounts.set(key, account)
      return Promise.resolve(account)
   }

   saveTransaction(transaction: LedgerTransaction): Promise<LedgerTransaction> {
      this.savedTransactions.push(transaction)
      return Promise.resolve(transaction)
   }
}

const makePrisma = (cancellation: Record<string, unknown>) => {
   const booking = makeBooking(cancellation)
   const cancellations = { update: jest.fn().mockResolvedValue({}) }
   const bookings = { findUnique: jest.fn().mockResolvedValue(booking) }
   return {
      bookings,
      cancellations,
      $transaction: jest.fn(
         async (callback: (tx: { cancellations: typeof cancellations }) => Promise<unknown>) =>
            callback({ cancellations })
      )
   }
}

const makeCommand = (overrides: Partial<AdminOverrideCancellationCommand> = {}) => ({
   bookingId: 'booking-1',
   adminId: 'admin-1',
   overrideReason: 'Goodwill adjustment',
   guestRefundCents: 1000000,
   hostPayoutCents: 1000000,
   platformFeeKeptCents: 1000000,
   ...overrides
})

const makeUseCase = (
   prisma: ReturnType<typeof makePrisma>,
   repository: InMemoryLedgerRepository
) => {
   const postTransactionUseCase = new PostTransactionUseCase(
      repository as unknown as LedgerRepository
   )
   return new AdminOverrideCancellationUseCase(
      prisma as unknown as PrismaService,
      postTransactionUseCase
   )
}

describe('AdminOverrideCancellationUseCase', () => {
   it('rejects negative amounts', async () => {
      const cancellation = makeCancellation()
      const prisma = makePrisma(cancellation)
      const useCase = makeUseCase(prisma, new InMemoryLedgerRepository())

      await expect(useCase.execute(makeCommand({ guestRefundCents: -1 }))).rejects.toThrow(
         new BadRequestException('Override amounts must not be negative')
      )
      await expect(
         useCase.execute(makeCommand({ hostPayoutCents: -1, guestRefundCents: 2000000 }))
      ).rejects.toThrow(BadRequestException)
      await expect(
         useCase.execute(makeCommand({ platformFeeKeptCents: -1, guestRefundCents: 2000000 }))
      ).rejects.toThrow(BadRequestException)
      expect(prisma.cancellations.update).not.toHaveBeenCalled()
      expect(prisma.$transaction).not.toHaveBeenCalled()
   })

   it('rejects amounts that do not sum to the booking total', async () => {
      const cancellation = makeCancellation()
      const prisma = makePrisma(cancellation)
      const useCase = makeUseCase(prisma, new InMemoryLedgerRepository())

      await expect(
         useCase.execute(
            makeCommand({
               guestRefundCents: 1000000,
               hostPayoutCents: 1000000,
               platformFeeKeptCents: 0
            })
         )
      ).rejects.toThrow(BadRequestException)
      expect(prisma.cancellations.update).not.toHaveBeenCalled()
   })

   it('rejects a non-cancelled booking', async () => {
      const prisma = makePrisma(makeCancellation())
      prisma.bookings.findUnique.mockResolvedValue({
         ...makeBooking(makeCancellation()),
         status: 'confirmed'
      })
      const useCase = makeUseCase(prisma, new InMemoryLedgerRepository())

      await expect(useCase.execute(makeCommand())).rejects.toThrow(BadRequestException)
      expect(prisma.cancellations.update).not.toHaveBeenCalled()
   })

   it('rejects a missing booking', async () => {
      const prisma = makePrisma(makeCancellation())
      prisma.bookings.findUnique.mockResolvedValue(null)
      const useCase = makeUseCase(prisma, new InMemoryLedgerRepository())

      await expect(useCase.execute(makeCommand())).rejects.toThrow(NotFoundException)
   })

   it('computes deltas and posts balanced adjustment entries for guest, host and platform', async () => {
      const cancellation = makeCancellation()
      const prisma = makePrisma(cancellation)
      const repository = new InMemoryLedgerRepository()
      const useCase = makeUseCase(prisma, repository)

      const result = await useCase.execute(makeCommand())

      expect(result.previous).toEqual({
         guestRefundCents: TOTAL_CENTS,
         hostPayoutCents: 0n,
         platformFeeKeptCents: 0n
      })
      expect(result.deltas).toEqual({
         guestRefundCents: -2000000n,
         hostPayoutCents: 1000000n,
         platformFeeKeptCents: 1000000n
      })
      expect(result.ledgerTransactionId).not.toBeNull()

      // Exactly one adjustment transaction was saved
      expect(repository.savedTransactions).toHaveLength(1)
      const txn = repository.savedTransactions[0]
      expect(txn.type).toBe('adjustment')
      expect(txn.bookingId).toBe('booking-1')
      expect(txn.createdBy).toBe('admin-1')
      const metadata = txn.metadata as {
         overrideReason: string
         previous: Record<string, string>
         next: Record<string, string>
      }
      expect(metadata.overrideReason).toBe('Goodwill adjustment')
      expect(metadata.previous).toEqual({
         guestRefundCents: '3000000',
         hostPayoutCents: '0',
         platformFeeKeptCents: '0'
      })
      expect(metadata.next).toEqual({
         guestRefundCents: '1000000',
         hostPayoutCents: '1000000',
         platformFeeKeptCents: '1000000'
      })

      // Entries move exactly the deltas and balance to zero
      const amounts = txn.entries.map((entry) => entry.amountCents)
      expect(amounts.sort()).toEqual([-2000000n, 1000000n, 1000000n].sort())
      expect(amounts.reduce((sum, amount) => sum + amount, 0n)).toBe(0n)

      // Each delta lands on the right ledger account
      const accountIdFor = (ownerType: string, ownerAccountId: string | null, subtype: string) =>
         repository.accounts.get(`${ownerType}:${ownerAccountId ?? '-'}:${subtype}`)?.id
      const guestEntry = txn.entries.find(
         (entry) => entry.ledgerAccountId === accountIdFor('guest', 'guest-1', 'clearing')
      )
      const hostEntry = txn.entries.find(
         (entry) => entry.ledgerAccountId === accountIdFor('host', 'host-1', 'payable')
      )
      const platformEntry = txn.entries.find(
         (entry) => entry.ledgerAccountId === accountIdFor('platform', null, 'clearing')
      )
      expect(guestEntry?.amountCents).toBe(-2000000n)
      expect(hostEntry?.amountCents).toBe(1000000n)
      expect(platformEntry?.amountCents).toBe(1000000n)
      // Escrow is untouched because the previous amounts already summed to the total
      expect(
         txn.entries.find(
            (entry) => entry.ledgerAccountId === accountIdFor('platform', null, 'escrow')
         )
      ).toBeUndefined()

      // The cancellation record is updated with previous values and the txn id
      expect(prisma.cancellations.update).toHaveBeenCalledWith({
         where: { id: 'cancellation-1' },
         data: {
            guest_refund_cents: 1000000n,
            host_payout_cents: 1000000n,
            platform_fee_kept_cents: 1000000n,
            override_reason: 'Goodwill adjustment',
            override_by_admin_id: 'admin-1',
            override_previous_guest_refund_cents: TOTAL_CENTS,
            override_previous_host_payout_cents: 0n,
            override_previous_platform_fee_kept_cents: 0n,
            override_ledger_transaction_id: txn.id
         }
      })
   })

   it('does not create a transaction when the values do not change', async () => {
      const cancellation = makeCancellation()
      const prisma = makePrisma(cancellation)
      const repository = new InMemoryLedgerRepository()
      const useCase = makeUseCase(prisma, repository)

      const result = await useCase.execute(
         makeCommand({ guestRefundCents: 3000000, hostPayoutCents: 0, platformFeeKeptCents: 0 })
      )

      expect(repository.savedTransactions).toHaveLength(0)
      expect(result.ledgerTransactionId).toBeNull()
      // The reference to the previous adjustment transaction is retained
      const firstUpdateCall = prisma.cancellations.update.mock.calls[0] as unknown as [
         { data: Record<string, unknown> }
      ]
      expect(firstUpdateCall[0].data).toMatchObject({
         override_reason: 'Goodwill adjustment',
         override_by_admin_id: 'admin-1'
      })
      expect(firstUpdateCall[0].data).not.toHaveProperty('override_ledger_transaction_id')
   })

   it('replaying the same override reuses the same idempotency key without duplicating', async () => {
      const cancellation = makeCancellation()
      const repository = new InMemoryLedgerRepository()

      const firstPrisma = makePrisma(cancellation)
      const secondPrisma = makePrisma(cancellation)
      const firstResult = await makeUseCase(firstPrisma, repository).execute(makeCommand())
      const secondResult = await makeUseCase(secondPrisma, repository).execute(makeCommand())

      expect(repository.savedTransactions).toHaveLength(1)
      expect(secondResult.ledgerTransactionId).toBe(firstResult.ledgerTransactionId)
      expect(repository.savedTransactions[0].idempotencyKey).toBe(
         'cancellation-override-cancellation-1-g1000000-h1000000-p1000000'
      )
   })

   it('records a report-only override without ledger entries when no refund transaction exists', async () => {
      const cancellation = makeCancellation({ ledger_transaction_id: null })
      const prisma = makePrisma(cancellation)
      const repository = new InMemoryLedgerRepository()
      const useCase = makeUseCase(prisma, repository)

      const result = await useCase.execute(makeCommand())

      expect(repository.savedTransactions).toHaveLength(0)
      expect(result.ledgerTransactionId).toBeNull()
      const reportOnlyUpdateCall = prisma.cancellations.update.mock.calls[0] as unknown as [
         { data: Record<string, unknown> }
      ]
      expect(reportOnlyUpdateCall[0].data).toMatchObject({
         guest_refund_cents: 1000000n,
         override_by_admin_id: 'admin-1'
      })
      expect(reportOnlyUpdateCall[0].data).not.toHaveProperty('override_ledger_transaction_id')
   })

   it('debits escrow when the previous amounts did not sum to the booking total', async () => {
      // E.g. a clamped platform fee at cancellation time: old sum is 100000 short
      const cancellation = makeCancellation({
         guest_refund_cents: 1000000n,
         host_payout_cents: 1000000n,
         platform_fee_kept_cents: 900000n
      })
      const prisma = makePrisma(cancellation)
      const repository = new InMemoryLedgerRepository()
      const useCase = makeUseCase(prisma, repository)

      await useCase.execute(makeCommand())

      expect(repository.savedTransactions).toHaveLength(1)
      const amounts = repository.savedTransactions[0].entries.map((entry) => entry.amountCents)
      expect(amounts.reduce((sum, amount) => sum + amount, 0n)).toBe(0n)
      expect(amounts.sort()).toEqual([100000n, -100000n].sort())
   })
})
