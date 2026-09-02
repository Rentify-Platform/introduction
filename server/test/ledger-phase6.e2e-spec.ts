import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter'
import { LedgerRepository } from '../src/modules/ledger/domain/repositories/ledger.repository'
import {
   PostTransactionCommand,
   PostTransactionEntryCommand,
   PostTransactionUseCase
} from '../src/modules/ledger/application/use-cases/post-transaction.usecase'
import request from 'supertest'
import { App } from 'supertest/types'

type ApiResponse<T> = {
   success: boolean
   message: string
   data: T
}

type BalanceData = { ledgerAccountId: string; balanceCents: string; updatedAt: string }

type ApiError = {
   success: boolean
   errorCode: string
   message: string
   statusCode: number
}

type LoginData = { accessToken: string }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

/**
 * Phase 6 — Lock down ledger endpoints writable/readable by end users.
 *
 * Rules under test:
 * - No user-facing actor (guest/host/admin) can POST arbitrary ledger
 *   transactions; ledger writes only happen inside payment, cancellation,
 *   payout and internal service flows.
 * - GET /ledger/accounts/balance is scoped: guests/hosts can only read
 *   personal accounts they own (never platform/tax_authority scopes and
 *   never another user's account), ownership cannot be widened via query
 *   parameters, and admin keeps the management scope.
 */
describeIfE2eDatabase('Ledger endpoint lockdown Phase 6 (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let ledgerRepository: LedgerRepository
   let postTransactionUseCase: PostTransactionUseCase

   const password = 'e2e-password-123'
   const runId = Date.now()

   const adminEmail = `e2e-p6-admin-${runId}@rentify.test`
   const hostEmail = `e2e-p6-host-${runId}@rentify.test`
   const guestEmail = `e2e-p6-guest-${runId}@rentify.test`
   const intruderEmail = `e2e-p6-intruder-${runId}@rentify.test`

   let adminToken: string
   let hostToken: string
   let guestToken: string
   let intruderToken: string

   let adminId: string
   let hostId: string
   let guestId: string
   let intruderId: string

   let guestLedgerAccountId: string
   let hostLedgerAccountId: string
   let platformRevenueBalanceBefore: bigint

   const guestSeedTxnKey = `e2e-p6-guest-seed-${runId}`
   const hostSeedTxnKey = `e2e-p6-host-seed-${runId}`
   const blockedTxnKey = `e2e-p6-blocked-attempt-${runId}`

   const login = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password })
      expect(res.status).toBe(201)
      return (res.body as ApiResponse<LoginData>).data.accessToken
   }

   const createAccount = async (
      email: string,
      role: 'admin' | 'guest' | 'host',
      firstName: string
   ) => {
      return prisma.accounts.create({
         data: {
            id: randomUUID(),
            email,
            password_hash: await bcrypt.hash(password, 4),
            role,
            status: 'active',
            profiles: {
               create: {
                  first_name: firstName,
                  last_name: 'Phase6',
                  guest_kyc_status: 'unverified'
               }
            }
         }
      })
   }

   const getBalance = (token: string | null, query: string) =>
      request(app.getHttpServer())
         .get(`/ledger/accounts/balance?${query}`)
         .set('Authorization', token ? `Bearer ${token}` : '')

   const postTransaction = (token: string | null, body: Record<string, unknown>) =>
      request(app.getHttpServer())
         .post('/ledger/transactions')
         .set('Authorization', token ? `Bearer ${token}` : '')
         .send(body)

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl

      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
      }).compile()

      app = moduleFixture.createNestApplication()
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
      app.useGlobalFilters(new HttpExceptionFilter())
      await app.init()

      prisma = app.get(PrismaService)
      ledgerRepository = app.get(LedgerRepository)
      postTransactionUseCase = app.get(PostTransactionUseCase)

      const admin = await createAccount(adminEmail, 'admin', 'Admin')
      adminId = admin.id
      const host = await createAccount(hostEmail, 'host', 'Host')
      hostId = host.id
      const guest = await createAccount(guestEmail, 'guest', 'Guest')
      guestId = guest.id
      const intruder = await createAccount(intruderEmail, 'guest', 'Intruder')
      intruderId = intruder.id

      adminToken = await login(adminEmail)
      hostToken = await login(hostEmail)
      guestToken = await login(guestEmail)
      intruderToken = await login(intruderEmail)

      // Baseline of the (shared) platform revenue balance so platform-side
      // assertions stay relative and deterministic.
      const beforeRes = await getBalance(
         adminToken,
         'ownerType=platform&accountSubtype=revenue&currency=VND'
      )
      expect(beforeRes.status).toBe(200)
      platformRevenueBalanceBefore = BigInt(
         (beforeRes.body as ApiResponse<BalanceData>).data.balanceCents
      )

      // Seed real ledger data through the internal posting flow: the guest and
      // the host each own one account with a non-zero, DB-backed balance.
      guestLedgerAccountId = (
         await ledgerRepository.getOrCreateAccount('guest', guestId, 'clearing', 'VND')
      ).id
      hostLedgerAccountId = (
         await ledgerRepository.getOrCreateAccount('host', hostId, 'payable', 'VND')
      ).id

      await postTransactionUseCase.execute(
         new PostTransactionCommand(
            guestSeedTxnKey,
            'booking_payment',
            null,
            'Phase 6 seed: guest ledger balance',
            null,
            null,
            [
               new PostTransactionEntryCommand(null, 'guest', guestId, 'clearing', 50000n, 'VND'),
               new PostTransactionEntryCommand(null, 'platform', null, 'revenue', -50000n, 'VND')
            ]
         )
      )
      await postTransactionUseCase.execute(
         new PostTransactionCommand(
            hostSeedTxnKey,
            'booking_payment',
            null,
            'Phase 6 seed: host ledger balance',
            null,
            null,
            [
               new PostTransactionEntryCommand(null, 'host', hostId, 'payable', 70000n, 'VND'),
               new PostTransactionEntryCommand(null, 'platform', null, 'revenue', -70000n, 'VND')
            ]
         )
      )

      // Fixture sanity: the balances really exist in the test database.
      const guestBalance = await ledgerRepository.findBalance(guestLedgerAccountId)
      const hostBalance = await ledgerRepository.findBalance(hostLedgerAccountId)
      expect(guestBalance?.balanceCents).toBe(50000n)
      expect(hostBalance?.balanceCents).toBe(70000n)
   })

   afterAll(async () => {
      if (prisma) {
         const safe = async (fn: () => Promise<unknown>) => {
            try {
               await fn()
            } catch {
               // Ignore cleanup failures on the disposable E2E database
               // (ledger_entries is append-only; the database is dropped anyway).
            }
         }
         const allIds = [adminId, hostId, guestId, intruderId]
         await safe(() =>
            prisma.ledger_accounts.deleteMany({ where: { owner_account_id: { in: allIds } } })
         )
         await safe(() => prisma.accounts.deleteMany({ where: { id: { in: allIds } } }))
      }
      await app?.close()
   })

   it('does not expose a public ledger write endpoint to any actor and leaves no side effect', async () => {
      const payload = {
         idempotencyKey: blockedTxnKey,
         type: 'adjustment',
         description: 'self-minted balance',
         entries: [
            {
               ownerType: 'guest',
               ownerAccountId: intruderId,
               accountSubtype: 'clearing',
               amountCents: 999999,
               currency: 'VND'
            },
            {
               ownerType: 'platform',
               accountSubtype: 'revenue',
               amountCents: -999999,
               currency: 'VND'
            }
         ]
      }

      for (const token of [guestToken, hostToken, adminToken]) {
         const res = await postTransaction(token, payload)
         expect(res.status).toBe(404)
         expect((res.body as ApiError).statusCode).toBe(404)
      }

      // Side effect check: no transaction was minted under the blocked key and
      // the intruder account never came into existence.
      const attempt = await prisma.ledger_transactions.findUnique({
         where: { idempotency_key: blockedTxnKey }
      })
      expect(attempt).toBeNull()
      const intruderAccount = await prisma.ledger_accounts.findFirst({
         where: { owner_type: 'guest', owner_account_id: intruderId }
      })
      expect(intruderAccount).toBeNull()
   })

   it('control case: guest and host read their own DB-backed balances normally', async () => {
      // Guest, without ownerAccountId: the selector defaults to the caller.
      const guestRes = await getBalance(
         guestToken,
         'ownerType=guest&accountSubtype=clearing&currency=VND'
      )
      expect(guestRes.status).toBe(200)
      const guestData = (guestRes.body as ApiResponse<BalanceData>).data
      expect(guestData.ledgerAccountId).toBe(guestLedgerAccountId)
      expect(guestData.balanceCents).toBe('50000')

      // Guest, explicitly passing their own ownerAccountId: same result.
      const explicitRes = await getBalance(
         guestToken,
         `ownerType=guest&ownerAccountId=${guestId}&accountSubtype=clearing&currency=VND`
      )
      expect(explicitRes.status).toBe(200)
      expect((explicitRes.body as ApiResponse<BalanceData>).data.balanceCents).toBe('50000')

      // Host control case with their own payable account.
      const hostRes = await getBalance(
         hostToken,
         'ownerType=host&accountSubtype=payable&currency=VND'
      )
      expect(hostRes.status).toBe(200)
      const hostData = (hostRes.body as ApiResponse<BalanceData>).data
      expect(hostData.ledgerAccountId).toBe(hostLedgerAccountId)
      expect(hostData.balanceCents).toBe('70000')
   })

   it('guest cannot read a host balance — neither by owner selector nor by account id', async () => {
      const bySelector = await getBalance(
         guestToken,
         `ownerType=host&ownerAccountId=${hostId}&accountSubtype=payable&currency=VND`
      )
      expect(bySelector.status).toBe(404)
      expect((bySelector.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_NOT_FOUND')

      const byAccountId = await getBalance(guestToken, `ledgerAccountId=${hostLedgerAccountId}`)
      expect(byAccountId.status).toBe(404)
      expect((byAccountId.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_NOT_FOUND')
   })

   it('a guest cannot read another guest balance — ownership cannot be widened via query parameters', async () => {
      const bySelector = await getBalance(
         intruderToken,
         `ownerType=guest&ownerAccountId=${guestId}&accountSubtype=clearing&currency=VND`
      )
      expect(bySelector.status).toBe(404)
      expect((bySelector.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_NOT_FOUND')

      const byAccountId = await getBalance(intruderToken, `ledgerAccountId=${guestLedgerAccountId}`)
      expect(byAccountId.status).toBe(404)
      expect((byAccountId.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_NOT_FOUND')

      // The victim balance is untouched after all the failed attempts.
      const victim = await ledgerRepository.findBalance(guestLedgerAccountId)
      expect(victim?.balanceCents).toBe(50000n)
   })

   it('personal actors cannot read platform or tax_authority scopes', async () => {
      for (const token of [hostToken, guestToken]) {
         const platformRes = await getBalance(
            token,
            'ownerType=platform&accountSubtype=revenue&currency=VND'
         )
         expect(platformRes.status).toBe(403)
         expect((platformRes.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_FORBIDDEN')

         const taxRes = await getBalance(
            token,
            'ownerType=tax_authority&accountSubtype=tax_payable_vn&currency=VND'
         )
         expect(taxRes.status).toBe(403)
         expect((taxRes.body as ApiError).errorCode).toBe('LEDGER_ACCOUNT_FORBIDDEN')
      }

      // The platform scope must not be creatable by user queries either.
      const taxAccount = await prisma.ledger_accounts.findFirst({
         where: { owner_type: 'tax_authority' }
      })
      expect(taxAccount).toBeNull()
   })

   it('admin keeps the management scope over any account', async () => {
      const platformRes = await getBalance(
         adminToken,
         'ownerType=platform&accountSubtype=revenue&currency=VND'
      )
      expect(platformRes.status).toBe(200)
      expect((platformRes.body as ApiResponse<BalanceData>).data.balanceCents).toBe(
         (platformRevenueBalanceBefore - 120000n).toString()
      )

      const hostRes = await getBalance(adminToken, `ledgerAccountId=${hostLedgerAccountId}`)
      expect(hostRes.status).toBe(200)
      expect((hostRes.body as ApiResponse<BalanceData>).data.balanceCents).toBe('70000')

      const guestRes = await getBalance(
         adminToken,
         `ownerType=guest&ownerAccountId=${guestId}&accountSubtype=clearing&currency=VND`
      )
      expect(guestRes.status).toBe(200)
      expect((guestRes.body as ApiResponse<BalanceData>).data.balanceCents).toBe('50000')
   })

   it('requires authentication on the balance endpoint', async () => {
      const noToken = await getBalance(null, 'ownerType=guest&accountSubtype=clearing&currency=VND')
      expect(noToken.status).toBe(401)

      const badToken = await getBalance(
         'not-a-jwt',
         'ownerType=guest&accountSubtype=clearing&currency=VND'
      )
      expect(badToken.status).toBe(401)
   })

   it('leaves the seeded ledger intact after every denied attempt', async () => {
      const guestSeed = await prisma.ledger_transactions.findUnique({
         where: { idempotency_key: guestSeedTxnKey }
      })
      const hostSeed = await prisma.ledger_transactions.findUnique({
         where: { idempotency_key: hostSeedTxnKey }
      })
      const blocked = await prisma.ledger_transactions.findUnique({
         where: { idempotency_key: blockedTxnKey }
      })

      expect(guestSeed).not.toBeNull()
      expect(hostSeed).not.toBeNull()
      expect(blocked).toBeNull()

      const guestAccount = await ledgerRepository.findBalance(guestLedgerAccountId)
      const hostAccount = await ledgerRepository.findBalance(hostLedgerAccountId)
      expect(guestAccount?.balanceCents).toBe(50000n)
      expect(hostAccount?.balanceCents).toBe(70000n)
   })
})
