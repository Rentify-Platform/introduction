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

type BookingData = {
   id: string
   status: string
   payment: {
      id: string
      status: string
   } | null
}

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Bookings Phase 2 ownership / admin cancel / late payment (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let sepayToken: string

   const runId = Date.now()
   const password = 'e2e-password-123'
   const adminEmail = `e2e-p2-admin-${runId}@rentify.test`
   const guest1Email = `e2e-p2-guest1-${runId}@rentify.test`
   const guest2Email = `e2e-p2-guest2-${runId}@rentify.test`
   const host1Email = `e2e-p2-host1-${runId}@rentify.test`
   const host2Email = `e2e-p2-host2-${runId}@rentify.test`

   let adminId: string
   let guest1Id: string
   let guest2Id: string
   let host1Id: string
   let host2Id: string
   let adminToken: string
   let guest1Token: string
   let guest2Token: string
   let host1Token: string
   let host2Token: string
   let propertyTypeId: number
   let property1Id: string
   let property2Id: string
   let bookingAId: string
   let bookingBId: string
   let paymentAId: string
   let paymentBId: string

   // SePay intent codes: the use case matches /RENTIFY([A-Z0-9]{8})/i
   const intentA = 'RENTIFYE2EA0001'
   const intentB = 'RENTIFYE2EB0001'

   const totalACents = 3000000n
   const totalBCents = 4500000n
   // amount_cents is VND * 100, so webhook transferAmount is in VND
   const totalAVnd = 30000
   const totalBVnd = 45000

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

   const countLedgerTransactions = async (bookingId: string): Promise<number> => {
      return prisma.ledger_transactions.count({ where: { booking_id: bookingId } })
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
      const guest1 = await createAccount(guest1Email, 'guest', 'E2E', 'Guest1')
      guest1Id = guest1.id
      const guest2 = await createAccount(guest2Email, 'guest', 'E2E', 'Guest2')
      guest2Id = guest2.id
      // Hosts need verified KYC profiles so their properties can be created as active
      const host1 = await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: host1Email,
            password_hash: await bcrypt.hash(password, 4),
            role: 'host',
            status: 'active',
            profiles: {
               create: {
                  first_name: 'E2E',
                  last_name: 'Host1'
               }
            },
            host_profiles: {
               create: {
                  kyc_status: 'verified'
               }
            }
         }
      })
      host1Id = host1.id
      const host2 = await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: host2Email,
            password_hash: await bcrypt.hash(password, 4),
            role: 'host',
            status: 'active',
            profiles: {
               create: {
                  first_name: 'E2E',
                  last_name: 'Host2'
               }
            },
            host_profiles: {
               create: {
                  kyc_status: 'verified'
               }
            }
         }
      })
      host2Id = host2.id

      adminToken = await login(adminEmail)
      guest1Token = await login(guest1Email)
      guest2Token = await login(guest2Email)
      host1Token = await login(host1Email)
      host2Token = await login(host2Email)

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-type-${runId}`, label: 'E2E Phase 2 Type' }
      })
      propertyTypeId = propertyType.id

      const property1 = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: host1Id,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'active',
            title: 'E2E Phase 2 Property 1',
            address_line1: '1 E2E Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 4,
            base_price_cents: 1000000n,
            cancellation_policy_code: 'moderate'
         }
      })
      property1Id = property1.id

      const property2 = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: host2Id,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'active',
            title: 'E2E Phase 2 Property 2',
            address_line1: '2 E2E Street',
            city: 'Da Nang',
            country_code: 'VN',
            latitude: 16.054407,
            longitude: 108.202164,
            max_guests: 4,
            base_price_cents: 1500000n,
            cancellation_policy_code: 'moderate'
         }
      })
      property2Id = property2.id

      const bookingA = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: property1Id,
            guest_id: guest1Id,
            host_id: host1Id,
            status: 'pending',
            check_in: new Date('2027-03-01T00:00:00.000Z'),
            check_out: new Date('2027-03-04T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1000000n,
            total_price_cents: totalACents,
            currency: 'VND',
            cancellation_policy_code: 'moderate'
         }
      })
      bookingAId = bookingA.id

      const bookingB = await prisma.bookings.create({
         data: {
            id: randomUUID(),
            property_id: property2Id,
            guest_id: guest1Id,
            host_id: host2Id,
            status: 'pending',
            check_in: new Date('2027-04-01T00:00:00.000Z'),
            check_out: new Date('2027-04-03T00:00:00.000Z'),
            guests_count: 2,
            nightly_rate_cents: 1500000n,
            total_price_cents: totalBCents,
            currency: 'VND',
            cancellation_policy_code: 'moderate'
         }
      })
      bookingBId = bookingB.id

      const paymentA = await prisma.payments.create({
         data: {
            id: randomUUID(),
            booking_id: bookingAId,
            status: 'pending',
            amount_cents: totalACents,
            currency: 'VND',
            provider: 'sepay',
            provider_intent_id: intentA
         }
      })
      paymentAId = paymentA.id

      const paymentB = await prisma.payments.create({
         data: {
            id: randomUUID(),
            booking_id: bookingBId,
            status: 'pending',
            amount_cents: totalBCents,
            currency: 'VND',
            provider: 'sepay',
            provider_intent_id: intentB
         }
      })
      paymentBId = paymentB.id
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
         const bookingIds = [bookingAId, bookingBId].filter(Boolean)
         if (bookingIds.length > 0) {
            await safe(() => prisma.payments.deleteMany({ where: { booking_id: { in: bookingIds } } }))
            await safe(() =>
               prisma.cancellations.deleteMany({ where: { booking_id: { in: bookingIds } } })
            )
            await safe(() => prisma.bookings.deleteMany({ where: { id: { in: bookingIds } } }))
         }
         const propertyIds = [property1Id, property2Id].filter(Boolean)
         if (propertyIds.length > 0) {
            await safe(() => prisma.properties.deleteMany({ where: { id: { in: propertyIds } } }))
         }
         if (propertyTypeId) {
            await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         }
         const accountIds = [adminId, guest1Id, guest2Id, host1Id, host2Id].filter(Boolean)
         if (accountIds.length > 0) {
            await safe(() => prisma.accounts.deleteMany({ where: { id: { in: accountIds } } }))
         }
      }
      await app?.close()
   })

   it('exposes booking details only to the involved guest/host and admins', async () => {
      // Guest sees their own booking
      const guestOwn = await request(app.getHttpServer())
         .get(`/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${guest1Token}`)
         .expect(200)
      const guestOwnBody = guestOwn.body as ApiResponse<BookingData>
      expect(guestOwnBody.data.id).toBe(bookingAId)
      expect(guestOwnBody.data.status).toBe('pending')

      // Host sees their own booking
      const hostOwn = await request(app.getHttpServer())
         .get(`/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${host1Token}`)
         .expect(200)
      const hostOwnBody = hostOwn.body as ApiResponse<BookingData>
      expect(hostOwnBody.data.id).toBe(bookingAId)

      // Unrelated guest and host get 404 so bookings cannot be enumerated
      await request(app.getHttpServer())
         .get(`/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${guest2Token}`)
         .expect(404)
      await request(app.getHttpServer())
         .get(`/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${host2Token}`)
         .expect(404)

      // Admin can view any booking, through both endpoints
      const adminUserEndpoint = await request(app.getHttpServer())
         .get(`/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      expect((adminUserEndpoint.body as ApiResponse<BookingData>).data.id).toBe(bookingAId)

      const adminEndpoint = await request(app.getHttpServer())
         .get(`/admin/bookings/${bookingAId}`)
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      expect((adminEndpoint.body as ApiResponse<BookingData>).data.id).toBe(bookingAId)
   })

   it('persists cancelled_by_admin and an admin audit record when an admin cancels', async () => {
      const res = await request(app.getHttpServer())
         .post(`/admin/bookings/${bookingAId}/cancel`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ reason: 'E2E policy violation' })
         .expect(201)

      const resBody = res.body as ApiResponse<BookingData>
      expect(resBody.data.status).toBe('cancelled_by_admin')

      const persisted = await prisma.bookings.findUnique({ where: { id: bookingAId } })
      expect(persisted?.status).toBe('cancelled_by_admin')
      expect(persisted?.cancelled_at).not.toBeNull()

      const audit = await prisma.cancellations.findFirst({ where: { booking_id: bookingAId } })
      expect(audit).not.toBeNull()
      expect(audit?.cancelled_by_role).toBe('admin')
      expect(audit?.cancelled_by_account_id).toBe(adminId)
      expect(audit?.reason_text).toBe('E2E policy violation')
      // No captured payment existed, so no money moved
      expect(audit?.guest_refund_cents.toString()).toBe('0')
      expect(audit?.host_payout_cents.toString()).toBe('0')
      expect(audit?.ledger_transaction_id).toBeNull()

      // A cancelled booking must not hold the dates anymore
      const overlapping = await prisma.bookings.count({
         where: {
            property_id: property1Id,
            status: { notIn: ['cancelled_by_guest', 'cancelled_by_host', 'cancelled_by_admin', 'expired'] }
         }
      })
      expect(overlapping).toBe(0)
   })

   it('rejects a late SePay payment for a cancelled booking and stays idempotent', async () => {
      const ledgerCountBefore = await countLedgerTransactions(bookingAId)
      expect(ledgerCountBefore).toBe(0)

      // Webhook without a valid API key must be rejected
      await request(app.getHttpServer())
         .post('/bookings/sepay-webhook')
         .send({
            gateway: 'MBBank',
            transactionDate: '20270301',
            referenceNumber: `FT${runId}`,
            transferAmount: totalAVnd,
            transactionContent: intentA
         })
         .expect(401)

      // Late transfer for the already cancelled booking
      const res = await request(app.getHttpServer())
         .post('/bookings/sepay-webhook')
         .set('x-api-key', sepayToken)
         .send({
            gateway: 'MBBank',
            transactionDate: '20270301',
            referenceNumber: `FT${runId}`,
            transferAmount: totalAVnd,
            transactionContent: intentA
         })
         .expect(200)

      const resBody = res.body as { success: boolean; message: string }
      expect(resBody.success).toBe(true)
      expect(resBody.message).toContain('rejected')

      const payment = await prisma.payments.findUnique({ where: { id: paymentAId } })
      expect(payment?.status).toBe('failed')
      expect(payment?.failure_reason).toContain('cancelled_by_admin')
      expect(payment?.ledger_transaction_id).toBeNull()

      const booking = await prisma.bookings.findUnique({ where: { id: bookingAId } })
      expect(booking?.status).toBe('cancelled_by_admin')

      expect(await countLedgerTransactions(bookingAId)).toBe(0)

      // Retrying the same webhook must not duplicate any side effect
      const retry = await request(app.getHttpServer())
         .post('/bookings/sepay-webhook')
         .set('x-api-key', sepayToken)
         .send({
            gateway: 'MBBank',
            transactionDate: '20270301',
            referenceNumber: `FT${runId}`,
            transferAmount: totalAVnd,
            transactionContent: intentA
         })
         .expect(200)

      const retryBody = retry.body as { success: boolean; message: string }
      expect(retryBody.success).toBe(true)
      expect(retryBody.message).toContain('already rejected')

      const paymentAfterRetry = await prisma.payments.findUnique({ where: { id: paymentAId } })
      expect(paymentAfterRetry?.status).toBe('failed')
      expect(await prisma.payments.count({ where: { booking_id: bookingAId } })).toBe(1)
      expect(await countLedgerTransactions(bookingAId)).toBe(0)
   })

   it('still captures payment and activates booking for a pending booking (control case)', async () => {
      const res = await request(app.getHttpServer())
         .post('/bookings/sepay-webhook')
         .set('x-api-key', sepayToken)
         .send({
            gateway: 'MBBank',
            transactionDate: '20270401',
            referenceNumber: `FTB${runId}`,
            transferAmount: totalBVnd,
            transactionContent: intentB
         })
         .expect(200)

      const resBody = res.body as { success: boolean; message: string }
      expect(resBody.success).toBe(true)

      const payment = await prisma.payments.findUnique({ where: { id: paymentBId } })
      expect(payment?.status).toBe('captured')
      expect(payment?.ledger_transaction_id).not.toBeNull()

      const booking = await prisma.bookings.findUnique({ where: { id: bookingBId } })
      // Property has instant_book = false, so payment moves it to pending_approval
      expect(booking?.status).toBe('pending_approval')

      const txns = await prisma.ledger_transactions.findMany({
         where: { booking_id: bookingBId }
      })
      expect(txns).toHaveLength(1)
      expect(txns[0].type).toBe('booking_payment')
      expect(txns[0].idempotency_key).toBe(paymentBId)
   })
})
