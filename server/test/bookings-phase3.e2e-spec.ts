import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import request from 'supertest'
import { App } from 'supertest/types'

type ApiResponse<T> = {
   success: boolean
   message: string
   data: T
}

type LoginData = {
   accessToken: string
}

type OverrideData = {
   bookingId: string
   guestRefundCents: string
   hostPayoutCents: string
   platformFeeKeptCents: string
   previousGuestRefundCents: string
   previousHostPayoutCents: string
   previousPlatformFeeKeptCents: string
   guestRefundDeltaCents: string
   hostPayoutDeltaCents: string
   platformFeeDeltaCents: string
   ledgerTransactionId: string | null
}

type CancellationItem = {
   bookingId: string
   guestRefundCents: string | null
   hostPayoutCents: string | null
   platformFeeKeptCents: string | null
   overridePreviousGuestRefundCents: string | null
   overridePreviousHostPayoutCents: string | null
   overridePreviousPlatformFeeKeptCents: string | null
   overrideLedgerTransactionId: string | null
}

type LedgerTxnItem = {
   id: string
   idempotencyKey: string
   type: string
   bookingId: string | null
   metadata: any
   createdBy: string | null
   entries: { ledgerAccountId: string; amountCents: string; currency: string }[]
}

type BalanceItem = {
   ownerType: string
   ownerAccountId: string | null
   accountSubtype: string
   currency: string
   balanceCents: string
}

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Bookings Phase 3 cancellation override ledger sync (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let sepayToken: string

   const runId = Date.now()
   const password = 'e2e-password-123'
   const adminEmail = `e2e-p3-admin-${runId}@rentify.test`
   const guestEmail = `e2e-p3-guest-${runId}@rentify.test`
   const hostEmail = `e2e-p3-host-${runId}@rentify.test`

   let adminId: string
   let guestId: string
   let hostId: string
   let adminToken: string
   let guestToken: string
   let propertyTypeId: number
   let propertyId: string
   let paidBookingId: string
   let unpaidBookingId: string
   let activeBookingId: string

   // The use case matches /RENTIFY([A-Z0-9]{8})/i
   const intent = 'RENTIFYE2EP3001'

   // nightly 1,000,000 x 3 nights, no extra fees
   const totalCents = 3000000n
   const totalVnd = 30000

   const createAccount = async (
      email: string,
      role: 'admin' | 'guest' | 'host',
      firstName: string,
      lastName: string
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
                  last_name: lastName
               }
            }
         }
      })
   }

   const login = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email, password })
         .expect(201)
      return (res.body as ApiResponse<LoginData>).data.accessToken
   }

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl
      // The webhook controller reads the token from env at request time
      sepayToken = process.env.SEPAY_WEBHOOK_TOKEN || 'e2e-sepay-webhook-token'
      process.env.SEPAY_WEBHOOK_TOKEN = sepayToken

      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
      }).compile()

      app = moduleFixture.createNestApplication()
      await app.init()
      prisma = app.get(PrismaService)

      const admin = await createAccount(adminEmail, 'admin', 'E2E', 'Admin')
      adminId = admin.id
      const guest = await createAccount(guestEmail, 'guest', 'E2E', 'Guest')
      guestId = guest.id
      // Host needs a verified KYC profile so the property can be created as active
      const host = await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: hostEmail,
            password_hash: await bcrypt.hash(password, 4),
            role: 'host',
            status: 'active',
            profiles: {
               create: {
                  first_name: 'E2E',
                  last_name: 'Host'
               }
            },
            host_profiles: {
               create: {
                  kyc_status: 'verified'
               }
            }
         }
      })
      hostId = host.id

      adminToken = await login(adminEmail)
      guestToken = await login(guestEmail)

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-type-${runId}`, label: 'E2E Phase 3 Type' }
      })
      propertyTypeId = propertyType.id

      const property = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: hostId,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'active',
            title: 'E2E Phase 3 Property',
            address_line1: '3 E2E Street',
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

      // Booking with a captured payment: capture via the SePay webhook, then the
      // guest cancels so a policy refund transaction is posted to the ledger.
      const paidBooking = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: propertyId,
            guest_id: guestId,
            host_id: hostId,
            status: 'pending',
            check_in: new Date('2027-06-01T00:00:00.000Z'),
            check_out: new Date('2027-06-04T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1000000n,
            total_price_cents: totalCents,
            currency: 'VND',
            cancellation_policy_code: 'moderate'
         }
      })
      paidBookingId = paidBooking.id

      const unpaidBooking = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: propertyId,
            guest_id: guestId,
            host_id: hostId,
            status: 'pending',
            check_in: new Date('2027-07-01T00:00:00.000Z'),
            check_out: new Date('2027-07-03T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1000000n,
            total_price_cents: totalCents,
            currency: 'VND',
            cancellation_policy_code: 'moderate'
         }
      })
      unpaidBookingId = unpaidBooking.id

      // Stays pending for authorization / invalid-state assertions
      const activeBooking = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: propertyId,
            guest_id: guestId,
            host_id: hostId,
            status: 'pending',
            check_in: new Date('2027-08-01T00:00:00.000Z'),
            check_out: new Date('2027-08-03T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1000000n,
            total_price_cents: totalCents,
            currency: 'VND',
            cancellation_policy_code: 'moderate'
         }
      })
      activeBookingId = activeBooking.id

      await prisma.payments.create({
         data: {
            id: randomUUID(),
            booking_id: paidBookingId,
            status: 'pending',
            amount_cents: totalCents,
            currency: 'VND',
            provider: 'sepay',
            provider_intent_id: intent
         }
      })

      // Capture the payment (control-case flow from phase 2)
      await request(app.getHttpServer())
         .post('/bookings/sepay-webhook')
         .set('x-api-key', sepayToken)
         .send({
            gateway: 'MBBank',
            transactionDate: '20270601',
            referenceNumber: `FTP3${runId}`,
            transferAmount: totalVnd,
            transactionContent: intent
         })
         .expect(200)

      // Guest cancels the paid booking: >=5 days before check-in under the
      // moderate policy means a 100% refund of the total to the guest.
      await request(app.getHttpServer())
         .post(`/bookings/${paidBookingId}/cancel`)
         .set('Authorization', `Bearer ${guestToken}`)
         .send({ reason: 'E2E phase 3 guest cancel' })
         .expect(201)

      // Guest cancels the unpaid booking: no captured payment, no ledger movement
      await request(app.getHttpServer())
         .post(`/bookings/${unpaidBookingId}/cancel`)
         .set('Authorization', `Bearer ${guestToken}`)
         .send({ reason: 'E2E phase 3 guest cancel (unpaid)' })
         .expect(201)
   })

   afterAll(async () => {
      if (prisma) {
         // Best-effort cleanup: the disposable E2E database is dropped after the
         // run, and ledger_entries is append-only (DELETE is blocked by trigger).
         const safe = async (fn: () => Promise<unknown>) => {
            try {
               await fn()
            } catch {
               // Ignore cleanup failures on the disposable E2E database
            }
         }
         const bookingIds = [paidBookingId, unpaidBookingId, activeBookingId].filter(Boolean)
         if (bookingIds.length > 0) {
            await safe(() =>
               prisma.payments.deleteMany({ where: { booking_id: { in: bookingIds } } })
            )
            await safe(() =>
               prisma.cancellations.deleteMany({ where: { booking_id: { in: bookingIds } } })
            )
            await safe(() => prisma.bookings.deleteMany({ where: { id: { in: bookingIds } } }))
         }
         if (propertyId) {
            await safe(() => prisma.properties.delete({ where: { id: propertyId } }))
         }
         if (propertyTypeId) {
            await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         }
         const accountIds = [adminId, guestId, hostId].filter(Boolean)
         if (accountIds.length > 0) {
            await safe(() => prisma.accounts.deleteMany({ where: { id: { in: accountIds } } }))
         }
      }
      await app?.close()
   })

   it('posts a balanced ledger adjustment and reconciles cancellation with the ledger', async () => {
      const auditBefore = await prisma.cancellations.findFirst({
         where: { booking_id: paidBookingId }
      })
      expect(auditBefore).not.toBeNull()
      expect(auditBefore?.guest_refund_cents.toString()).toBe('3000000')
      expect(auditBefore?.host_payout_cents.toString()).toBe('0')
      expect(auditBefore?.platform_fee_kept_cents.toString()).toBe('0')
      expect(auditBefore?.ledger_transaction_id).not.toBeNull()

      // Snapshot the platform singleton balances before the override; they are
      // shared by every suite in the database, so assertions must be deltas
      const beforeRes = await request(app.getHttpServer())
         .get('/admin/ledger/balances')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const beforeBody = beforeRes.body as ApiResponse<BalanceItem[]>
      const balanceIn = (
         body: BalanceItem[],
         ownerType: string,
         ownerAccountId: string | null,
         subtype: string
      ) =>
         body.find(
            (balance) =>
               balance.ownerType === ownerType &&
               balance.ownerAccountId === ownerAccountId &&
               balance.accountSubtype === subtype &&
               balance.currency === 'VND'
         )?.balanceCents ?? '0'
      const platformClearingBefore = balanceIn(beforeBody.data, 'platform', null, 'clearing')
      const platformEscrowBefore = balanceIn(beforeBody.data, 'platform', null, 'escrow')

      const overrideRes = await request(app.getHttpServer())
         .post(`/admin/bookings/${paidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E goodwill: guest receives less, host compensated',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1000000
         })
         .expect(201)

      const overrideBody = overrideRes.body as ApiResponse<OverrideData>
      expect(overrideBody.data.previousGuestRefundCents).toBe('3000000')
      expect(overrideBody.data.previousHostPayoutCents).toBe('0')
      expect(overrideBody.data.previousPlatformFeeKeptCents).toBe('0')
      expect(overrideBody.data.guestRefundDeltaCents).toBe('-2000000')
      expect(overrideBody.data.hostPayoutDeltaCents).toBe('1000000')
      expect(overrideBody.data.platformFeeDeltaCents).toBe('1000000')
      const adjustmentTxnId = overrideBody.data.ledgerTransactionId
      expect(adjustmentTxnId).not.toBeNull()

      // The cancellation record keeps the new amounts plus the audit trail
      const audit = await prisma.cancellations.findFirst({ where: { booking_id: paidBookingId } })
      expect(audit?.guest_refund_cents.toString()).toBe('1000000')
      expect(audit?.host_payout_cents.toString()).toBe('1000000')
      expect(audit?.platform_fee_kept_cents.toString()).toBe('1000000')
      expect(audit?.override_previous_guest_refund_cents?.toString()).toBe('3000000')
      expect(audit?.override_previous_host_payout_cents?.toString()).toBe('0')
      expect(audit?.override_previous_platform_fee_kept_cents?.toString()).toBe('0')
      expect(audit?.override_by_admin_id).toBe(adminId)
      expect(audit?.override_ledger_transaction_id).toBe(adjustmentTxnId)

      // Read the cancellation back through the API
      const listRes = await request(app.getHttpServer())
         .get('/admin/cancellations')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const listBody = listRes.body as ApiResponse<{ data: CancellationItem[] }>
      const cancellationApi = listBody.data.data.find((item) => item.bookingId === paidBookingId)
      expect(cancellationApi).toBeDefined()
      expect(cancellationApi?.guestRefundCents).toBe('1000000')
      expect(cancellationApi?.hostPayoutCents).toBe('1000000')
      expect(cancellationApi?.platformFeeKeptCents).toBe('1000000')
      expect(cancellationApi?.overridePreviousGuestRefundCents).toBe('3000000')
      expect(cancellationApi?.overridePreviousHostPayoutCents).toBe('0')
      expect(cancellationApi?.overridePreviousPlatformFeeKeptCents).toBe('0')
      expect(cancellationApi?.overrideLedgerTransactionId).toBe(adjustmentTxnId)

      // Read the ledger through the API: booking payment + policy refund + adjustment
      const txnsRes = await request(app.getHttpServer())
         .get(`/admin/ledger/transactions?bookingId=${paidBookingId}`)
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const txnsBody = txnsRes.body as ApiResponse<{ data: LedgerTxnItem[]; total: number }>
      expect(txnsBody.data.total).toBe(3)
      const types = txnsBody.data.data.map((txn) => txn.type).sort()
      expect(types).toEqual(['adjustment', 'booking_payment', 'refund'])
      const adjustment = txnsBody.data.data.find((txn) => txn.type === 'adjustment')
      expect(adjustment).toBeDefined()
      expect(adjustment!.id).toBe(adjustmentTxnId)
      expect(adjustment!.createdBy).toBe(adminId)
      const adjustmentMetadata = adjustment!.metadata as {
         cancellationId: string
         previous: Record<string, string>
         next: Record<string, string>
      }
      expect(adjustmentMetadata.cancellationId).toBe(audit!.id)
      expect(adjustmentMetadata.previous).toEqual({
         guestRefundCents: '3000000',
         hostPayoutCents: '0',
         platformFeeKeptCents: '0'
      })
      expect(adjustmentMetadata.next).toEqual({
         guestRefundCents: '1000000',
         hostPayoutCents: '1000000',
         platformFeeKeptCents: '1000000'
      })
      expect(adjustment!.idempotencyKey).toBe(
         `cancellation-override-${audit!.id}-g1000000-h1000000-p1000000`
      )

      // Reconcile: the adjustment entries move exactly the reported deltas and balance
      const entrySum = adjustment!.entries.reduce(
         (sum, entry) => sum + BigInt(entry.amountCents),
         0n
      )
      expect(entrySum).toBe(0n)
      const accountByKey = await prisma.ledger_accounts.findMany({
         where: {
            OR: [{ owner_type: 'platform' }, { owner_account_id: { in: [guestId, hostId] } }]
         }
      })
      const accountIdFor = (ownerType: string, ownerAccountId: string | null, subtype: string) =>
         accountByKey.find(
            (account) =>
               account.owner_type === ownerType &&
               account.owner_account_id === ownerAccountId &&
               account.account_subtype === subtype
         )?.id
      const amountFor = (ownerType: string, ownerAccountId: string | null, subtype: string) =>
         adjustment!.entries.find(
            (entry) => entry.ledgerAccountId === accountIdFor(ownerType, ownerAccountId, subtype)
         )?.amountCents ?? null
      expect(amountFor('guest', guestId, 'clearing')).toBe('-2000000')
      expect(amountFor('host', hostId, 'payable')).toBe('1000000')
      expect(amountFor('platform', null, 'clearing')).toBe('1000000')
      // Escrow untouched: previous amounts already summed to the booking total
      expect(amountFor('platform', null, 'escrow')).toBeNull()

      // Balances moved by the deltas: guest 3M -> 1M, host 0 -> 1M; the
      // adjustment never touches platform escrow and moves platform clearing
      // by exactly the platform fee delta
      const balancesRes = await request(app.getHttpServer())
         .get('/admin/ledger/balances')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const balancesBody = balancesRes.body as ApiResponse<BalanceItem[]>
      const balanceFor = (ownerType: string, ownerAccountId: string | null, subtype: string) =>
         balancesBody.data.find(
            (balance) =>
               balance.ownerType === ownerType &&
               balance.ownerAccountId === ownerAccountId &&
               balance.accountSubtype === subtype &&
               balance.currency === 'VND'
         )?.balanceCents ?? null
      expect(balanceFor('guest', guestId, 'clearing')).toBe('1000000')
      expect(balanceFor('host', hostId, 'payable')).toBe('1000000')
      // Platform accounts are global singletons shared by every suite in the
      // database, so assert them as deltas against the pre-override snapshot
      expect(BigInt(balanceFor('platform', null, 'clearing')!)).toBe(
         BigInt(platformClearingBefore) + 1000000n
      )
      expect(BigInt(balanceFor('platform', null, 'escrow')!)).toBe(BigInt(platformEscrowBefore))
   })

   it('rejects override amounts that do not sum to the booking total', async () => {
      const res = await request(app.getHttpServer())
         .post(`/admin/bookings/${paidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E invalid sum',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 0
         })
         .expect(400)

      const resBody = res.body as { message?: string }
      expect(resBody.message).toContain('booking total')
      expect(
         await prisma.ledger_transactions.count({
            where: { booking_id: paidBookingId, type: 'adjustment' }
         })
      ).toBe(1)
   })

   it('rejects override from a non-admin actor', async () => {
      const auditBefore = await prisma.cancellations.findFirst({
         where: { booking_id: paidBookingId }
      })
      await request(app.getHttpServer())
         .post(`/admin/bookings/${paidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${guestToken}`)
         .send({
            overrideReason: 'E2E unauthorized actor',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1000000
         })
         .expect(403)

      // No override side effect happened
      const audit = await prisma.cancellations.findFirst({ where: { booking_id: paidBookingId } })
      expect(audit?.override_reason).toBe(auditBefore?.override_reason)
      expect(audit?.guest_refund_cents.toString()).toBe(auditBefore?.guest_refund_cents.toString())
   })

   it('rejects override for a booking that does not exist', async () => {
      await request(app.getHttpServer())
         .post(`/admin/bookings/${randomUUID()}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E missing booking',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1000000
         })
         .expect(404)
   })

   it('rejects override for a booking that is not cancelled', async () => {
      await request(app.getHttpServer())
         .post(`/admin/bookings/${activeBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E non-cancelled booking',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1000000
         })
         .expect(400)

      expect(await prisma.cancellations.count({ where: { booking_id: activeBookingId } })).toBe(0)
      expect(
         await prisma.ledger_transactions.count({ where: { booking_id: activeBookingId } })
      ).toBe(0)
   })

   it('rejects negative override amounts', async () => {
      const res = await request(app.getHttpServer())
         .post(`/admin/bookings/${paidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E negative amount',
            guestRefundCents: -1,
            hostPayoutCents: 0,
            platformFeeKeptCents: 3000000
         })
         .expect(400)

      const resBody = res.body as { message?: string }
      expect(resBody.message).toContain('must not be negative')
      expect(
         await prisma.ledger_transactions.count({
            where: { booking_id: paidBookingId, type: 'adjustment' }
         })
      ).toBe(1)
   })

   it('does not create a ledger transaction when the override changes nothing', async () => {
      const res = await request(app.getHttpServer())
         .post(`/admin/bookings/${paidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E replay of the same amounts',
            guestRefundCents: 1000000,
            hostPayoutCents: 1000000,
            platformFeeKeptCents: 1000000
         })
         .expect(201)

      const resBody = res.body as ApiResponse<OverrideData>
      expect(resBody.data.ledgerTransactionId).toBeNull()

      const audit = await prisma.cancellations.findFirst({ where: { booking_id: paidBookingId } })
      expect(audit?.override_reason).toBe('E2E replay of the same amounts')
      // The reference to the latest adjustment transaction is retained
      expect(audit?.override_ledger_transaction_id).not.toBeNull()
      expect(
         await prisma.ledger_transactions.count({
            where: { booking_id: paidBookingId, type: 'adjustment' }
         })
      ).toBe(1)
   })

   it('records a report-only override for a cancellation without captured payment', async () => {
      const res = await request(app.getHttpServer())
         .post(`/admin/bookings/${unpaidBookingId}/override-cancellation`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            overrideReason: 'E2E unpaid booking report-only override',
            guestRefundCents: 2000000,
            hostPayoutCents: 500000,
            platformFeeKeptCents: 500000
         })
         .expect(201)

      const resBody = res.body as ApiResponse<OverrideData>
      // No refund transaction ever existed, so minting ledger balances backed by
      // nothing would corrupt the books; the override stays report-only.
      expect(resBody.data.ledgerTransactionId).toBeNull()
      expect(
         await prisma.ledger_transactions.count({ where: { booking_id: unpaidBookingId } })
      ).toBe(0)

      const audit = await prisma.cancellations.findFirst({
         where: { booking_id: unpaidBookingId }
      })
      expect(audit?.guest_refund_cents.toString()).toBe('2000000')
      expect(audit?.host_payout_cents.toString()).toBe('500000')
      expect(audit?.platform_fee_kept_cents.toString()).toBe('500000')
      expect(audit?.override_previous_guest_refund_cents?.toString()).toBe('0')
      expect(audit?.override_ledger_transaction_id).toBeNull()

      const listRes = await request(app.getHttpServer())
         .get('/admin/cancellations')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const listBody = listRes.body as ApiResponse<{ data: CancellationItem[] }>
      const cancellationApi = listBody.data.data.find((item) => item.bookingId === unpaidBookingId)
      expect(cancellationApi?.overrideLedgerTransactionId).toBeNull()
      expect(cancellationApi?.overridePreviousGuestRefundCents).toBe('0')
   })
})
