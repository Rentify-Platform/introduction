import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter'
import request from 'supertest'
import { App } from 'supertest/types'

type ApiResponse<T> = {
   success: boolean
   message: string
   data: T
}

type ApiError = {
   success: boolean
   errorCode: string
   message: string
   statusCode: number
}

type LoginData = { accessToken: string }
type SubmitKycData = { documentId: string; status: string; verificationResult: string }
type ReviewKycData = { documentId: string; status: string }
type RegisterHostData = { accountId: string; kycStatus: string }
type RescreenData = { totalRescreened: number; passedCount: number; failedCount: number }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

/**
 * Phase 5 — KYC guest/host scope (Model A: account-level identity KYC).
 *
 * Business decision under test: an identity KYC document verifies the PERSON,
 * not the role. A single KYC decision (pending/verified/rejected/expired) must
 * be reflected on BOTH profiles.guest_kyc_status AND host_profiles.kyc_status
 * (when a host profile exists) — updating both is intentional, and a host whose
 * identity is rejected loses the right to publish listings by design.
 */
describeIfE2eDatabase('KYC guest/host scope Phase 5 (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService

   const password = 'e2e-password-123'
   const runId = Date.now()

   const adminEmail = `e2e-p5-admin-${runId}@rentify.test`
   const hostAEmail = `e2e-p5-host-a-${runId}@rentify.test`
   const hostBEmail = `e2e-p5-host-b-${runId}@rentify.test`
   const rescreenHostEmail = `e2e-p5-host-rescreen-${runId}@rentify.test`
   const guestOnlyEmail = `e2e-p5-guest-${runId}@rentify.test`

   let adminToken: string
   let hostAToken: string
   let hostBToken: string
   let rescreenHostToken: string
   let guestOnlyToken: string
   let guestToken: string

   let adminId: string
   let hostAId: string
   let hostBId: string
   let rescreenHostId: string
   let guestOnlyId: string
   let guestId: string

   let hostADocumentId: string
   let hostBDocumentId: string
   let guestOnlyDocumentId: string
   let rescreenSecondDocumentId: string

   let propertyTypeId: number
   let hostBPausedPropertyId: string

   const login = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password })
      expect(res.status).toBe(201)
      return (res.body as ApiResponse<LoginData>).data.accessToken
   }

   const createAccount = async (
      email: string,
      role: 'admin' | 'guest' | 'host',
      firstName: string,
      withHostProfile: boolean,
      hostKycStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired' = 'unverified',
      guestKycStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired' = 'unverified'
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
                  last_name: 'Phase5',
                  guest_kyc_status: guestKycStatus
               }
            },
            ...(withHostProfile ? { host_profiles: { create: { kyc_status: hostKycStatus } } } : {})
         }
      })
   }

   const submitKyc = (token: string, fileUrlFront: string) =>
      request(app.getHttpServer())
         .post('/kyc/submit')
         .set('Authorization', `Bearer ${token}`)
         .send({ docType: 'passport', countryCode: 'VN', fileUrlFront })

   const reviewKyc = (token: string | null, documentId: string, body: Record<string, unknown>) =>
      request(app.getHttpServer())
         .post(`/admin/kyc/review/${documentId}`)
         .set('Authorization', token ? `Bearer ${token}` : '')
         .send(body)

   const guestStatus = async (accountId: string) => {
      const profile = await prisma.profiles.findUnique({ where: { account_id: accountId } })
      return profile?.guest_kyc_status
   }

   const hostStatus = async (accountId: string) => {
      const hostProfile = await prisma.host_profiles.findUnique({
         where: { account_id: accountId }
      })
      return hostProfile?.kyc_status
   }

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

      const admin = await createAccount(adminEmail, 'admin', 'Admin', false)
      adminId = admin.id
      const hostA = await createAccount(hostAEmail, 'host', 'HostA', true)
      hostAId = hostA.id
      const hostB = await createAccount(hostBEmail, 'host', 'HostB', true)
      hostBId = hostB.id
      const rescreenHost = await createAccount(
         rescreenHostEmail,
         'host',
         'HostRescreen',
         true,
         'expired',
         'expired'
      )
      rescreenHostId = rescreenHost.id
      const guestOnly = await createAccount(guestOnlyEmail, 'guest', 'GuestOnly', false)
      guestOnlyId = guestOnly.id
      const guest = await createAccount(
         `e2e-p5-intruder-${runId}@rentify.test`,
         'guest',
         'Intruder',
         false
      )
      guestId = guest.id

      // Rescreen fixture: an expiring background check for the rescreen host
      await prisma.kyc_checks.create({
         data: {
            id: randomUUID(),
            account_id: rescreenHostId,
            check_type: 'background_check',
            provider: 'previous-provider',
            provider_reference_id: `expiring-${runId}`,
            result: 'pass',
            score: 80,
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
         }
      })

      // Property fixture for the publish gate assertion (host B, KYC unverified)
      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-p5-type-${runId}`, label: 'E2E Phase 5 Type' }
      })
      propertyTypeId = propertyType.id
      const pausedProperty = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: hostBId,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'paused',
            title: `Phase5 KYC Gate ${runId}`,
            address_line1: '1 Phase Five Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 2,
            base_price_cents: 800000n,
            cancellation_policy_code: 'moderate',
            requires_local_license: false
         }
      })
      hostBPausedPropertyId = pausedProperty.id

      adminToken = await login(adminEmail)
      hostAToken = await login(hostAEmail)
      hostBToken = await login(hostBEmail)
      rescreenHostToken = await login(rescreenHostEmail)
      guestOnlyToken = await login(guestOnlyEmail)
      guestToken = await login(`e2e-p5-intruder-${runId}@rentify.test`)
   })

   afterAll(async () => {
      if (prisma) {
         const safe = async (fn: () => Promise<unknown>) => {
            try {
               await fn()
            } catch {
               // Ignore cleanup failures on the disposable E2E database
            }
         }
         const allIds = [adminId, hostAId, hostBId, rescreenHostId, guestOnlyId, guestId]
         await safe(() => prisma.kyc_checks.deleteMany({ where: { account_id: { in: allIds } } }))
         await safe(() =>
            prisma.kyc_documents.deleteMany({ where: { account_id: { in: allIds } } })
         )
         await safe(() => prisma.properties.deleteMany({ where: { id: hostBPausedPropertyId } }))
         await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         await safe(() => prisma.accounts.deleteMany({ where: { id: { in: allIds } } }))
      }
      await app?.close()
   })

   it('submitting a KYC document marks BOTH guest and host profile as pending', async () => {
      const res = await submitKyc(hostAToken, `https://cdn.rentify.test/p5/front-a-${runId}.png`)
      expect(res.status).toBe(201)
      const body = res.body as ApiResponse<SubmitKycData>
      expect(body.data.status).toBe('pending')
      // Mock provider routes unflagged URLs to manual review, never auto-pass
      expect(body.data.verificationResult).toBe('review_required')
      hostADocumentId = body.data.documentId

      const doc = await prisma.kyc_documents.findUnique({ where: { id: hostADocumentId } })
      expect(doc?.status).toBe('pending')
      expect(doc?.account_id).toBe(hostAId)

      expect(await guestStatus(hostAId)).toBe('pending')
      expect(await hostStatus(hostAId)).toBe('pending')
   })

   it('admin approval updates BOTH profiles — the account-level identity rule (Model A)', async () => {
      const res = await reviewKyc(adminToken, hostADocumentId, { action: 'approve' })
      expect(res.status).toBe(201)
      const body = res.body as ApiResponse<ReviewKycData>
      expect(body.data.status).toBe('verified')

      const doc = await prisma.kyc_documents.findUnique({ where: { id: hostADocumentId } })
      expect(doc?.status).toBe('verified')
      expect(doc?.reviewed_by).toBe(adminId)
      expect(doc?.reviewed_at).not.toBeNull()

      // Model A core assertion: one identity decision, both profiles move together
      expect(await guestStatus(hostAId)).toBe('verified')
      expect(await hostStatus(hostAId)).toBe('verified')

      // Approved document leaves the admin pending queue
      const pendingRes = await request(app.getHttpServer())
         .get('/admin/kyc/pending')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
      const pendingDocs = (pendingRes.body as ApiResponse<Array<{ id: string }>>).data
      expect(pendingDocs.some((d) => d.id === hostADocumentId)).toBe(false)
   })

   it('control case: host onboarding completes normally on top of the verified account KYC', async () => {
      const res = await request(app.getHttpServer())
         .post('/hosts/register')
         .set('Authorization', `Bearer ${hostAToken}`)
         .send({
            taxCountry: 'VN',
            taxId: '0123456789',
            taxFormType: 'w8ben',
            payoutProvider: 'sepay',
            payoutAccountId: '0901234567'
         })
         .expect(201)

      const body = res.body as ApiResponse<RegisterHostData>
      expect(body.data.kycStatus).toBe('verified')

      const hostProfile = await prisma.host_profiles.findUnique({ where: { account_id: hostAId } })
      expect(hostProfile?.tax_verified).toBe(true)
      expect(hostProfile?.payout_account_verified).toBe(true)
      expect(hostProfile?.kyc_status).toBe('verified')
   })

   it('rejecting host identity KYC demotes both profiles and keeps the publish gate blocked', async () => {
      const submitRes = await submitKyc(
         hostBToken,
         `https://cdn.rentify.test/p5/front-b-${runId}.png`
      )
      expect(submitRes.status).toBe(201)
      hostBDocumentId = (submitRes.body as ApiResponse<SubmitKycData>).data.documentId
      expect(await guestStatus(hostBId)).toBe('pending')
      expect(await hostStatus(hostBId)).toBe('pending')

      const rejectRes = await reviewKyc(adminToken, hostBDocumentId, {
         action: 'reject',
         rejectionReason: 'Document is not readable'
      })
      expect(rejectRes.status).toBe(201)
      expect((rejectRes.body as ApiResponse<ReviewKycData>).data.status).toBe('rejected')

      const doc = await prisma.kyc_documents.findUnique({ where: { id: hostBDocumentId } })
      expect(doc?.status).toBe('rejected')
      expect(doc?.rejection_reason).toBe('Document is not readable')

      // Model A intended behavior: identity rejection applies account-wide
      expect(await guestStatus(hostBId)).toBe('rejected')
      expect(await hostStatus(hostBId)).toBe('rejected')

      // The publish gate stays enforced for the demoted host
      const activateRes = await request(app.getHttpServer())
         .patch(`/admin/properties/${hostBPausedPropertyId}/status`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ status: 'active' })
      expect(activateRes.status).toBe(403)
      expect((activateRes.body as ApiError).errorCode).toBe('HOST_NOT_VERIFIED')

      const property = await prisma.properties.findUnique({ where: { id: hostBPausedPropertyId } })
      expect(property?.status).toBe('paused')
   })

   it('rescreen applies its result to the whole account scope (both profiles)', async () => {
      expect(await guestStatus(rescreenHostId)).toBe('expired')
      expect(await hostStatus(rescreenHostId)).toBe('expired')

      const res = await request(app.getHttpServer())
         .post('/admin/kyc/rescreen')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(201)

      const body = res.body as ApiResponse<RescreenData>
      expect(body.data.totalRescreened).toBeGreaterThanOrEqual(1)
      expect(body.data.passedCount).toBeGreaterThanOrEqual(1)

      // Both profiles move from expired back to verified (account scope)
      expect(await guestStatus(rescreenHostId)).toBe('verified')
      expect(await hostStatus(rescreenHostId)).toBe('verified')

      // A fresh background check row was persisted with a ~1 year expiry
      const checks = await prisma.kyc_checks.findMany({
         where: { account_id: rescreenHostId, check_type: 'background_check' },
         orderBy: { created_at: 'asc' }
      })
      expect(checks.length).toBe(2)
      const newCheck = checks[checks.length - 1]
      expect(newCheck.provider_reference_id).toContain('bg-check-')
      expect(newCheck.result).toBe('pass')
      expect(newCheck.expires_at!.getTime()).toBeGreaterThan(Date.now() + 300 * 24 * 60 * 60 * 1000)
   })

   it('guest-only account: review updates the guest profile and never creates a host profile', async () => {
      const submitRes = await submitKyc(
         guestOnlyToken,
         `https://cdn.rentify.test/p5/front-guest-${runId}.png`
      )
      expect(submitRes.status).toBe(201)
      guestOnlyDocumentId = (submitRes.body as ApiResponse<SubmitKycData>).data.documentId
      expect(await guestStatus(guestOnlyId)).toBe('pending')

      const approveRes = await reviewKyc(adminToken, guestOnlyDocumentId, { action: 'approve' })
      expect(approveRes.status).toBe(201)

      expect(await guestStatus(guestOnlyId)).toBe('verified')
      const hostProfile = await prisma.host_profiles.findUnique({
         where: { account_id: guestOnlyId }
      })
      expect(hostProfile).toBeNull()
   })

   it('admin endpoints reject unauthorized actors and missing resources without side effects', async () => {
      // A pending victim document used for the failed-review attempts
      const submitRes = await submitKyc(
         rescreenHostToken,
         `https://cdn.rentify.test/p5/front-second-${runId}.png`
      )
      expect(submitRes.status).toBe(201)
      rescreenSecondDocumentId = (submitRes.body as ApiResponse<SubmitKycData>).data.documentId

      // Submit without a token → 401
      await request(app.getHttpServer())
         .post('/kyc/submit')
         .send({ docType: 'passport', fileUrlFront: 'https://cdn.rentify.test/x.png' })
         .expect(401)

      // Non-admin reviewing → 403, document untouched
      const forbiddenRes = await reviewKyc(guestToken, rescreenSecondDocumentId, {
         action: 'approve'
      })
      expect(forbiddenRes.status).toBe(403)
      expect((forbiddenRes.body as ApiError).errorCode).toBe('FORBIDDEN')

      // Unknown document → 404
      const missingRes = await reviewKyc(adminToken, randomUUID(), { action: 'approve' })
      expect(missingRes.status).toBe(404)
      expect((missingRes.body as ApiError).errorCode).toBe('KYC_DOCUMENT_NOT_FOUND')

      // The victim document is still pending after all failed attempts
      const victim = await prisma.kyc_documents.findUnique({
         where: { id: rescreenSecondDocumentId }
      })
      expect(victim?.status).toBe('pending')
      expect(await guestStatus(rescreenHostId)).toBe('pending')
   })

   it('review validation and re-submission edges keep existing decisions intact', async () => {
      // Reject without a reason → 400, no write
      const noReasonRes = await reviewKyc(adminToken, rescreenSecondDocumentId, {
         action: 'reject'
      })
      expect(noReasonRes.status).toBe(400)

      // Invalid action → 400 (ValidationPipe)
      const invalidActionRes = await reviewKyc(adminToken, rescreenSecondDocumentId, {
         action: 'maybe'
      })
      expect(invalidActionRes.status).toBe(400)

      // Already-reviewed document → 409
      const alreadyRes = await reviewKyc(adminToken, hostADocumentId, { action: 'approve' })
      expect(alreadyRes.status).toBe(409)
      expect((alreadyRes.body as ApiError).errorCode).toBe('KYC_DOCUMENT_ALREADY_REVIEWED')

      // Resubmitting KYC on a verified account → 400
      const resubmitRes = await submitKyc(
         hostAToken,
         `https://cdn.rentify.test/p5/again-${runId}.png`
      )
      expect(resubmitRes.status).toBe(400)
      expect((resubmitRes.body as ApiError).errorCode).toBe('KYC_ALREADY_VERIFIED')

      // Nothing changed for the victim document or the verified account
      const victim = await prisma.kyc_documents.findUnique({
         where: { id: rescreenSecondDocumentId }
      })
      expect(victim?.status).toBe('pending')
      const hostADocs = await prisma.kyc_documents.findMany({ where: { account_id: hostAId } })
      expect(hostADocs.length).toBe(1)
      expect(hostADocs[0]?.status).toBe('verified')
   })
})
