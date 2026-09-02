import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'crypto'
import { PrismaModule } from '../src/prisma/prisma.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { LedgerInfrastructureModule } from '../src/modules/ledger/infrastructure/ledger.infrastructure.module'
import { LedgerRepository } from '../src/modules/ledger/domain/repositories/ledger.repository'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../src/modules/ledger/application/use-cases/post-transaction.usecase'
import {
   AdminOverrideCancellationCommand,
   AdminOverrideCancellationUseCase
} from '../src/modules/bookings/application/use-cases/admin-override-cancellation.usecase'

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

// Integration test: boots the real use case against a real database (no HTTP),
// verifying the plan's Phase 3 integration checklist:
//   1. Override cancellation            -> AdminOverrideCancellationUseCase.execute
//   2. Check cancellation record        -> cancellations row
//   3. Check ledger adjustment txn      -> ledger_transactions + entries
//   4. Check balance guest/host/platform-> ledger_balances
//   5. Check transaction balanced       -> entry sum per transaction
// plus atomicity: the cancellation update and the ledger adjustment must commit
// and roll back together (plan step 8).
describeIfE2eDatabase('Cancellation override ledger sync (integration)', () => {
   let moduleRef: TestingModule
   let prisma: PrismaService
   let postTransactionUseCase: PostTransactionUseCase
   let useCase: AdminOverrideCancellationUseCase

   const runId = Date.now()
   const totalCents = 3000000n

   let adminId: string
   let guest1Id: string
   let host1Id: string
   let guest2Id: string
   let host2Id: string
   let propertyTypeId: number
   let propertyId: string
   let paidBookingId: string
   let paidCancellationId: string
   let atomicBookingId: string
   let atomicCancellationId: string

   const createAccount = async (role: 'admin' | 'guest' | 'host') => {
      const suffix = randomUUID().slice(0, 8)
      return prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: `e2e-p3i-${role}-${runId}-${suffix}@rentify.test`,
            password_hash: 'integration-test-not-used',
            role,
            status: 'active',
            // Hosts need verified KYC profiles so their properties can be created
            // as active (fn_check_listing_activation trigger)
            ...(role === 'host' ? { host_profiles: { create: { kyc_status: 'verified' } } } : {})
         }
      })
   }

   const createCancelledFixture = async (
      guestId: string,
      hostId: string,
      refundIdempotencyKey: string
   ) => {
      const booking = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: propertyId,
            guest_id: guestId,
            host_id: hostId,
            status: 'cancelled_by_guest',
            check_in: new Date('2027-08-01T00:00:00.000Z'),
            check_out: new Date('2027-08-04T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1000000n,
            total_price_cents: totalCents,
            currency: 'VND',
            cancellation_policy_code: 'moderate',
            cancelled_at: new Date()
         }
      })

      // The policy refund transaction that a captured payment would have posted:
      // escrow debited by the total, guest clearing credited by the total.
      const refund = await postTransactionUseCase.execute(
         new PostTransactionCommand(
            refundIdempotencyKey,
            'refund',
            booking.id,
            `Integration fixture refund for booking ${booking.id}`,
            null,
            null,
            [
               new PostTransactionEntryCommand(
                  null,
                  'platform',
                  null,
                  'escrow',
                  -totalCents,
                  'VND'
               ),
               new PostTransactionEntryCommand(
                  null,
                  'guest',
                  guestId,
                  'clearing',
                  totalCents,
                  'VND'
               )
            ]
         )
      )

      const cancellation = await prisma.cancellations.create({
         data: {
            booking_id: booking.id,
            cancelled_by_account_id: guestId,
            cancelled_by_role: 'guest',
            days_before_checkin: 300,
            applied_policy_code: 'moderate',
            guest_refund_cents: totalCents,
            host_payout_cents: 0n,
            platform_fee_kept_cents: 0n,
            reason_text: 'Integration fixture cancellation',
            ledger_transaction_id: refund.id
         }
      })

      return { bookingId: booking.id, cancellationId: cancellation.id, refundTxnId: refund.id }
   }

   const makeCommand = (
      bookingId: string,
      adminIdForCommand: string,
      overrides: Partial<AdminOverrideCancellationCommand> = {}
   ): AdminOverrideCancellationCommand => ({
      bookingId,
      adminId: adminIdForCommand,
      overrideReason: 'Integration override',
      guestRefundCents: 1000000,
      hostPayoutCents: 1000000,
      platformFeeKeptCents: 1000000,
      ...overrides
   })

   const accountIdFor = async (
      ownerType: string,
      ownerAccountId: string | null,
      subtype: string
   ): Promise<string | null> => {
      const account = await prisma.ledger_accounts.findFirst({
         where: {
            owner_type: ownerType as 'platform' | 'guest' | 'host',
            owner_account_id: ownerAccountId,
            account_subtype: subtype,
            currency: 'VND'
         }
      })
      return account?.id ?? null
   }

   const balanceFor = async (
      ownerType: string,
      ownerAccountId: string | null,
      subtype: string
   ): Promise<string> => {
      const accountId = await accountIdFor(ownerType, ownerAccountId, subtype)
      if (!accountId) return '0'
      const balance = await prisma.ledger_balances.findUnique({
         where: { ledger_account_id: accountId }
      })
      return balance?.balance_cents.toString() ?? '0'
   }

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl

      moduleRef = await Test.createTestingModule({
         imports: [PrismaModule, LedgerInfrastructureModule]
      }).compile()
      await moduleRef.init()

      prisma = moduleRef.get(PrismaService)
      const ledgerRepository = moduleRef.get<LedgerRepository>(LedgerRepository)
      postTransactionUseCase = new PostTransactionUseCase(ledgerRepository)
      useCase = new AdminOverrideCancellationUseCase(prisma, postTransactionUseCase)

      const admin = await createAccount('admin')
      adminId = admin.id
      const guest1 = await createAccount('guest')
      guest1Id = guest1.id
      const host1 = await createAccount('host')
      host1Id = host1.id
      const guest2 = await createAccount('guest')
      guest2Id = guest2.id
      const host2 = await createAccount('host')
      host2Id = host2.id

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-p3i-type-${runId}`, label: 'Integration Phase 3 Type' }
      })
      propertyTypeId = propertyType.id

      const property = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: host1Id,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'active',
            title: 'Integration Phase 3 Property',
            address_line1: '4 Integration Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 4,
            base_price_cents: 1000000n,
            cancellation_policy_code: 'moderate'
         }
      })
      propertyId = property.id

      const first = await createCancelledFixture(guest1Id, host1Id, `int-refund-1-${runId}`)
      paidBookingId = first.bookingId
      paidCancellationId = first.cancellationId

      const second = await createCancelledFixture(guest2Id, host2Id, `int-refund-2-${runId}`)
      atomicBookingId = second.bookingId
      atomicCancellationId = second.cancellationId
   })

   afterAll(async () => {
      if (prisma) {
         // Best-effort cleanup: the disposable E2E database is dropped after the
         // run; ledger_entries is append-only (DELETE blocked by trigger), so
         // bookings/cancellations referencing ledger rows may remain.
         const safe = async (fn: () => Promise<unknown>) => {
            try {
               await fn()
            } catch {
               // Ignore cleanup failures on the disposable E2E database
            }
         }
         await safe(() =>
            prisma.cancellations.deleteMany({
               where: { booking_id: { in: [paidBookingId, atomicBookingId] } }
            })
         )
         await safe(() =>
            prisma.bookings.deleteMany({
               where: { id: { in: [paidBookingId, atomicBookingId] } }
            })
         )
         await safe(() => prisma.properties.deleteMany({ where: { id: propertyId } }))
         await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         await safe(() =>
            prisma.accounts.deleteMany({
               where: { id: { in: [adminId, guest1Id, host1Id, guest2Id, host2Id] } }
            })
         )
      }
      await moduleRef?.close()
   })

   it('overrides the cancellation, posts a balanced adjustment and updates balances', async () => {
      // Platform singleton accounts are shared across suites in the database, so
      // their balances are asserted as deltas around the override
      const platformClearingBefore = await balanceFor('platform', null, 'clearing')
      const platformEscrowBefore = await balanceFor('platform', null, 'escrow')

      const result = await useCase.execute(makeCommand(paidBookingId, adminId))

      expect(result.previous).toEqual({
         guestRefundCents: totalCents,
         hostPayoutCents: 0n,
         platformFeeKeptCents: 0n
      })
      expect(result.deltas).toEqual({
         guestRefundCents: -2000000n,
         hostPayoutCents: 1000000n,
         platformFeeKeptCents: 1000000n
      })
      expect(result.ledgerTransactionId).not.toBeNull()

      // 2. Cancellation record reflects the override with the full audit trail
      const audit = await prisma.cancellations.findUnique({ where: { id: paidCancellationId } })
      expect(audit?.guest_refund_cents.toString()).toBe('1000000')
      expect(audit?.host_payout_cents.toString()).toBe('1000000')
      expect(audit?.platform_fee_kept_cents.toString()).toBe('1000000')
      expect(audit?.override_previous_guest_refund_cents?.toString()).toBe('3000000')
      expect(audit?.override_previous_host_payout_cents?.toString()).toBe('0')
      expect(audit?.override_previous_platform_fee_kept_cents?.toString()).toBe('0')
      expect(audit?.override_by_admin_id).toBe(adminId)
      expect(audit?.override_reason).toBe('Integration override')
      expect(audit?.override_ledger_transaction_id).toBe(result.ledgerTransactionId)

      // 3. Ledger adjustment transaction with deltas as entries
      const adjustment = await prisma.ledger_transactions.findUnique({
         where: { id: result.ledgerTransactionId! },
         include: { ledger_entries: true }
      })
      expect(adjustment?.type).toBe('adjustment')
      expect(adjustment?.booking_id).toBe(paidBookingId)
      expect(adjustment?.created_by).toBe(adminId)
      expect(adjustment?.idempotency_key).toBe(
         `cancellation-override-${paidCancellationId}-g1000000-h1000000-p1000000`
      )

      // 4+5. Entries move exactly the deltas and the transaction balances to zero
      const guestAccountId = await accountIdFor('guest', guest1Id, 'clearing')
      const hostAccountId = await accountIdFor('host', host1Id, 'payable')
      const platformClearingId = await accountIdFor('platform', null, 'clearing')
      const escrowId = await accountIdFor('platform', null, 'escrow')
      const amountFor = (accountId: string | null) =>
         adjustment?.ledger_entries
            .filter((entry) => entry.ledger_account_id === accountId)
            .reduce((sum, entry) => sum + entry.amount_cents, 0n)
      expect(amountFor(guestAccountId)).toBe(-2000000n)
      expect(amountFor(hostAccountId)).toBe(1000000n)
      expect(amountFor(platformClearingId)).toBe(1000000n)
      // No escrow entry at all: previous amounts already summed to the total
      expect(amountFor(escrowId)).toBe(0n)
      const entrySum = adjustment!.ledger_entries.reduce(
         (sum, entry) => sum + entry.amount_cents,
         0n
      )
      expect(entrySum).toBe(0n)

      // Balances moved by the deltas (started at guest 3M from the refund fixture)
      expect(await balanceFor('guest', guest1Id, 'clearing')).toBe('1000000')
      expect(await balanceFor('host', host1Id, 'payable')).toBe('1000000')
      expect(BigInt(await balanceFor('platform', null, 'clearing'))).toBe(
         BigInt(platformClearingBefore) + 1000000n
      )
      // Escrow only carries the original refund debits; the adjustment did not touch it
      expect(BigInt(await balanceFor('platform', null, 'escrow'))).toBe(
         BigInt(platformEscrowBefore)
      )
   })

   it('supports repeated overrides and never duplicates the same idempotency key', async () => {
      const result = await useCase.execute(
         makeCommand(paidBookingId, adminId, {
            guestRefundCents: 500000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1500000
         })
      )

      expect(result.ledgerTransactionId).not.toBeNull()
      const audit = await prisma.cancellations.findUnique({ where: { id: paidCancellationId } })
      expect(audit?.guest_refund_cents.toString()).toBe('500000')
      // The second override's "previous" values are the first override's outcome
      expect(audit?.override_previous_guest_refund_cents?.toString()).toBe('1000000')
      expect(audit?.override_previous_host_payout_cents?.toString()).toBe('1000000')
      expect(audit?.override_previous_platform_fee_kept_cents?.toString()).toBe('1000000')

      const adjustments = await prisma.ledger_transactions.findMany({
         where: { booking_id: paidBookingId, type: 'adjustment' }
      })
      expect(adjustments).toHaveLength(2)
      for (const txn of adjustments) {
         const entries = await prisma.ledger_entries.findMany({
            where: { transaction_id: txn.id }
         })
         const sum = entries.reduce((acc, entry) => acc + entry.amount_cents, 0n)
         expect(sum).toBe(0n)
      }

      // Posting the same idempotency key again must return the existing
      // transaction instead of minting a duplicate
      const existing = await prisma.ledger_transactions.findUnique({
         where: { idempotency_key: adjustments[0].idempotency_key },
         include: { ledger_entries: true }
      })
      const replayed = await postTransactionUseCase.execute(
         new PostTransactionCommand(
            adjustments[0].idempotency_key,
            'adjustment',
            paidBookingId,
            'Duplicate submit attempt',
            null,
            adminId,
            []
         )
      )
      expect(replayed.id).toBe(existing?.id)
      expect(
         await prisma.ledger_transactions.count({
            where: { idempotency_key: adjustments[0].idempotency_key }
         })
      ).toBe(1)
   })

   it('rolls back the ledger adjustment when the cancellation update fails', async () => {
      // The cancellation update violates the FK on override_by_admin_id, which
      // must roll back the ledger adjustment posted inside the same transaction.
      const phantomAdminId = randomUUID()
      const guestBalanceBefore = await balanceFor('guest', guest2Id, 'clearing')
      const escrowBefore = await balanceFor('platform', null, 'escrow')

      await expect(useCase.execute(makeCommand(atomicBookingId, phantomAdminId))).rejects.toThrow()

      // Nothing diverged: no adjustment transaction, unchanged record and balances
      const orphaned = await prisma.ledger_transactions.findMany({
         where: {
            idempotency_key: `cancellation-override-${atomicCancellationId}-g1000000-h1000000-p1000000`
         }
      })
      expect(orphaned).toHaveLength(0)

      const auditAfterFailure = await prisma.cancellations.findUnique({
         where: { id: atomicCancellationId }
      })
      expect(auditAfterFailure?.guest_refund_cents.toString()).toBe('3000000')
      expect(auditAfterFailure?.override_by_admin_id).toBeNull()
      expect(auditAfterFailure?.override_ledger_transaction_id).toBeNull()
      expect(await balanceFor('guest', guest2Id, 'clearing')).toBe(guestBalanceBefore)
      expect(await balanceFor('platform', null, 'escrow')).toBe(escrowBefore)

      // A retry with a valid admin succeeds and posts exactly one adjustment
      const result = await useCase.execute(makeCommand(atomicBookingId, adminId))
      expect(result.ledgerTransactionId).not.toBeNull()
      const audit = await prisma.cancellations.findUnique({
         where: { id: atomicCancellationId }
      })
      expect(audit?.guest_refund_cents.toString()).toBe('1000000')
      expect(audit?.override_by_admin_id).toBe(adminId)
      expect(audit?.override_ledger_transaction_id).toBe(result.ledgerTransactionId)
      expect(
         await prisma.ledger_transactions.count({
            where: { booking_id: atomicBookingId, type: 'adjustment' }
         })
      ).toBe(1)
   })
})
