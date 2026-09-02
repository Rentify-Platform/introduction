import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { MeilisearchService } from '../src/shared/meilisearch/meilisearch.service'
import { OutboxProcessor } from '../src/shared/meilisearch/outbox.processor'
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter'
import request from 'supertest'
import { App } from 'supertest/types'

// In-memory Meilisearch index fake with an injectable failure switch so the
// worker retry behavior can be exercised deterministically.
class FakePropertiesIndex {
   documents = new Map<string, Record<string, any>>()
   failNextAdd = false

   updateSettings(): Promise<void> {
      return Promise.resolve()
   }

   addDocuments(documents: Record<string, any>[]): Promise<void> {
      if (this.failNextAdd) {
         this.failNextAdd = false
         return Promise.reject(new Error('injected meili failure'))
      }
      for (const doc of documents) {
         this.documents.set(String(doc.id), { ...doc })
      }
      return Promise.resolve()
   }

   deleteDocument(documentId: string | string[]): Promise<void> {
      const ids = Array.isArray(documentId) ? documentId : [documentId]
      for (const id of ids) {
         this.documents.delete(String(id))
      }
      return Promise.resolve()
   }

   deleteAllDocuments(): Promise<void> {
      this.documents.clear()
      return Promise.resolve()
   }

   search(query: string) {
      const q = (query || '').toLowerCase()
      const hits = Array.from(this.documents.values()).filter(
         (doc) => doc.status === 'active' && (!q || String(doc.title).toLowerCase().includes(q))
      )
      return Promise.resolve({
         hits,
         estimatedTotalHits: hits.length,
         query,
         processingTimeMs: 0
      })
   }
}

class FakeMeilisearchService {
   readonly propertiesIndex = new FakePropertiesIndex()

   getPropertiesIndex(): FakePropertiesIndex {
      return this.propertiesIndex
   }

   syncAllProperties(): Promise<number> {
      return Promise.resolve(0)
   }

   onModuleInit(): void {}
}

type LoginData = { accessToken: string }
type ListingData = { id: string; status: string; title?: string }
type ErrorBody = { errorCode: string; message: string }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

// Functional/feature test: exercises the complete admin<->user<->search flows
// over real HTTP (host publish, admin pause/activate, guest search/detail) plus
// the HTTP edge cases (validation, authentication, authorization, visibility of
// draft/missing listings) and the outbox worker edges (retry, attempt limit).
describeIfE2eDatabase('Listings Phase 4 functional flows and edge cases (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let fakeMeili: FakeMeilisearchService
   let outboxProcessor: OutboxProcessor

   const runId = Date.now()
   const password = 'e2e-password-123'
   const adminEmail = `e2e-p4f-admin-${runId}@rentify.test`
   const hostEmail = `e2e-p4f-host-${runId}@rentify.test`
   const hostUnverifiedEmail = `e2e-p4f-hostu-${runId}@rentify.test`
   const guestEmail = `e2e-p4f-guest-${runId}@rentify.test`
   const draftTitle = `Phase4 Functional Draft ${runId}`
   const licenseTitle = `Phase4 Functional Licensed ${runId}`

   let adminToken: string
   let hostToken: string
   let hostUnverifiedToken: string
   let guestToken: string
   let adminId: string
   let hostId: string
   let hostUnverifiedId: string
   let guestId: string
   let propertyTypeId: number
   let draftPropertyId: string
   let licenseRequiredPropertyId: string
   let unverifiedHostPropertyId: string
   let workerEdgePropertyId: string
   const workerEventIds: string[] = []

   const createAccount = async (
      email: string,
      role: 'admin' | 'guest' | 'host',
      firstName: string,
      lastName: string,
      kycVerified: boolean
   ) => {
      return prisma.accounts.create({
         data: {
            id: randomUUID(),
            email,
            password_hash: await bcrypt.hash(password, 4),
            role,
            status: 'active',
            profiles: { create: { first_name: firstName, last_name: lastName } },
            ...(role === 'host'
               ? { host_profiles: { create: { kyc_status: kycVerified ? 'verified' : 'pending' } } }
               : {})
         }
      })
   }

   const login = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password })
      expect(res.status).toBe(201)
      const body = res.body as { data: LoginData }
      return body.data.accessToken
   }

   const createProperty = async (
      hostIdForProperty: string,
      status: 'draft' | 'paused' | 'active',
      requiresLocalLicense: boolean,
      title: string
   ): Promise<string> => {
      const property = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: hostIdForProperty,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status,
            title,
            address_line1: '2 Functional Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 4,
            base_price_cents: 1200000n,
            cancellation_policy_code: 'moderate',
            requires_local_license: requiresLocalLicense
         }
      })
      return property.id
   }

   const patchStatus = (token: string | null, id: string, status: string) =>
      request(app.getHttpServer())
         .patch(`/admin/properties/${id}/status`)
         .set('Authorization', token ? `Bearer ${token}` : '')
         .send({ status })

   const getDetail = (id: string, token?: string) =>
      request(app.getHttpServer())
         .get(`/properties/detail/${id}`)
         .set('Authorization', token ? `Bearer ${token}` : '')

   const searchByTitle = async (title: string) => {
      const res = await request(app.getHttpServer()).get('/properties').query({ query: title })
      expect(res.status).toBe(200)
      const body = res.body as { data: { items: ListingData[] } }
      return body.data.items
   }

   const processOutbox = async () => {
      await outboxProcessor.processOutboxEvents()
   }

   const eventsFor = async (id: string) =>
      prisma.outbox_events.findMany({
         where: { aggregate_type: 'property', aggregate_id: id },
         orderBy: { created_at: 'asc' }
      })

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl

      fakeMeili = new FakeMeilisearchService()

      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
         .overrideProvider(MeilisearchService)
         .useValue(fakeMeili)
         // The app's scheduled processor must not race the deterministic manual runs
         .overrideProvider(OutboxProcessor)
         .useValue({ processOutboxEvents: async () => {} })
         .compile()

      app = moduleRef.createNestApplication()
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
      app.useGlobalFilters(new HttpExceptionFilter())
      await app.init()

      prisma = app.get(PrismaService)
      outboxProcessor = new OutboxProcessor(prisma, fakeMeili as unknown as MeilisearchService)

      const admin = await createAccount(adminEmail, 'admin', 'Phase4F', 'Admin', false)
      adminId = admin.id
      const host = await createAccount(hostEmail, 'host', 'Phase4F', 'Host', true)
      hostId = host.id
      const hostUnverified = await createAccount(
         hostUnverifiedEmail,
         'host',
         'Phase4F',
         'HostUnverified',
         false
      )
      hostUnverifiedId = hostUnverified.id
      const guest = await createAccount(guestEmail, 'guest', 'Phase4F', 'Guest', false)
      guestId = guest.id

      adminToken = await login(adminEmail)
      hostToken = await login(hostEmail)
      hostUnverifiedToken = await login(hostUnverifiedEmail)
      guestToken = await login(guestEmail)

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-p4f-type-${runId}`, label: 'E2E Phase 4 Functional Type' }
      })
      propertyTypeId = propertyType.id

      draftPropertyId = await createProperty(hostId, 'draft', false, draftTitle)
      licenseRequiredPropertyId = await createProperty(hostId, 'paused', true, licenseTitle)
      unverifiedHostPropertyId = await createProperty(
         hostUnverifiedId,
         'paused',
         false,
         `Phase4 Functional Unverified ${runId}`
      )
      workerEdgePropertyId = await createProperty(
         hostId,
         'active',
         false,
         `Phase4 Functional Worker ${runId}`
      )
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
         const fixtureIds = [
            draftPropertyId,
            licenseRequiredPropertyId,
            unverifiedHostPropertyId,
            workerEdgePropertyId
         ]
         await safe(() =>
            prisma.outbox_events.deleteMany({
               where: { aggregate_type: 'property', aggregate_id: { in: fixtureIds } }
            })
         )
         await safe(() =>
            prisma.outbox_events.deleteMany({ where: { id: { in: workerEventIds } } })
         )
         await safe(() =>
            prisma.property_licenses.deleteMany({ where: { property_id: { in: fixtureIds } } })
         )
         await safe(() => prisma.properties.deleteMany({ where: { id: { in: fixtureIds } } }))
         await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         await safe(() =>
            prisma.accounts.deleteMany({
               where: { id: { in: [adminId, hostId, hostUnverifiedId, guestId] } }
            })
         )
      }
      await app?.close()
   })

   it('draft listing is hidden from public detail and search but visible to owner and admin', async () => {
      const anonymousRes = await getDetail(draftPropertyId)
      expect(anonymousRes.status).toBe(404)
      const anonymousError = anonymousRes.body as ErrorBody
      expect(anonymousError.errorCode).toBe('PROPERTY_NOT_FOUND')

      const basicRes = await request(app.getHttpServer()).get(`/properties/${draftPropertyId}`)
      expect(basicRes.status).toBe(404)

      const ownerRes = await getDetail(draftPropertyId, hostToken)
      expect(ownerRes.status).toBe(200)
      const ownerBody = ownerRes.body as { data: { property: ListingData } }
      expect(ownerBody.data.property.id).toBe(draftPropertyId)

      const adminRes = await getDetail(draftPropertyId, adminToken)
      expect(adminRes.status).toBe(200)

      const searchItems = await searchByTitle(draftTitle)
      expect(searchItems.some((item) => item.id === draftPropertyId)).toBe(false)
   })

   it('feature: host publish flow records an outbox event, indexes the listing and makes it publicly viewable', async () => {
      const publishRes = await request(app.getHttpServer())
         .post(`/properties/${draftPropertyId}/publish`)
         .set('Authorization', `Bearer ${hostToken}`)
      expect(publishRes.status).toBe(201)
      const publishBody = publishRes.body as { data: ListingData }
      expect(publishBody.data.status).toBe('active')

      const row = await prisma.properties.findUniqueOrThrow({ where: { id: draftPropertyId } })
      expect(row.status).toBe('active')
      expect(row.published_at).not.toBeNull()

      // The host flow emits its event through repository.save()
      const events = await eventsFor(draftPropertyId)
      expect(events).toHaveLength(1)
      expect(events[0].payload).toEqual({ status: 'active' })

      await processOutbox()

      const doc = fakeMeili.propertiesIndex.documents.get(draftPropertyId)
      expect(doc).toBeDefined()
      expect(doc?.status).toBe('active')

      const searchItems = await searchByTitle(draftTitle)
      expect(searchItems.some((item) => item.id === draftPropertyId)).toBe(true)

      const guestRes = await getDetail(draftPropertyId)
      expect(guestRes.status).toBe(200)
   })

   it('feature: admin pause hides the listing from search and public detail while the host edit access is preserved', async () => {
      const res = await patchStatus(adminToken, draftPropertyId, 'paused')
      expect(res.status).toBe(200)

      await processOutbox()
      expect(fakeMeili.propertiesIndex.documents.has(draftPropertyId)).toBe(false)

      const searchItems = await searchByTitle(draftTitle)
      expect(searchItems.some((item) => item.id === draftPropertyId)).toBe(false)

      const guestRes = await getDetail(draftPropertyId)
      expect(guestRes.status).toBe(404)

      const guestWithTokenRes = await getDetail(draftPropertyId, guestToken)
      expect(guestWithTokenRes.status).toBe(404)

      const guestBasicRes = await request(app.getHttpServer()).get(`/properties/${draftPropertyId}`)
      expect(guestBasicRes.status).toBe(404)

      const ownerRes = await getDetail(draftPropertyId, hostToken)
      expect(ownerRes.status).toBe(200)
      const ownerBody = ownerRes.body as { data: { property: ListingData } }
      expect(ownerBody.data.property.title).toBe(draftTitle)

      const adminRes = await getDetail(draftPropertyId, adminToken)
      expect(adminRes.status).toBe(200)
   })

   it('edge: admin activation is rejected without a verified license and leaves no side effects', async () => {
      const eventsBefore = await eventsFor(licenseRequiredPropertyId)
      expect(eventsBefore).toHaveLength(0)

      const res = await patchStatus(adminToken, licenseRequiredPropertyId, 'active')
      expect(res.status).toBe(400)
      const error = res.body as ErrorBody
      expect(error.errorCode).toBe('PROPERTY_LICENSE_REQUIRED')

      const row = await prisma.properties.findUniqueOrThrow({
         where: { id: licenseRequiredPropertyId }
      })
      expect(row.status).toBe('paused')
      expect(row.deleted_at).toBeNull()
      expect(await eventsFor(licenseRequiredPropertyId)).toHaveLength(0)

      await processOutbox()
      expect(fakeMeili.propertiesIndex.documents.has(licenseRequiredPropertyId)).toBe(false)
   })

   it('feature: submitting a license unlocks admin activation and the listing becomes searchable', async () => {
      const licenseRes = await request(app.getHttpServer())
         .post(`/properties/${licenseRequiredPropertyId}/license`)
         .set('Authorization', `Bearer ${hostToken}`)
         .send({
            licenseNumber: `LIC-P4F-${runId}`,
            issuingAuthority: 'Hanoi Authority',
            fileUrl: 'https://example.com/p4f-license.pdf',
            expiryDate: '2099-12-31'
         })
      expect(licenseRes.status).toBe(201)

      const activateRes = await patchStatus(adminToken, licenseRequiredPropertyId, 'active')
      expect(activateRes.status).toBe(200)
      const body = activateRes.body as { data: ListingData }
      expect(body.data.status).toBe('active')

      const events = await eventsFor(licenseRequiredPropertyId)
      expect(events).toHaveLength(1)
      expect(events[0].payload).toEqual({ status: 'active' })

      await processOutbox()

      const doc = fakeMeili.propertiesIndex.documents.get(licenseRequiredPropertyId)
      expect(doc).toBeDefined()
      expect(doc?.status).toBe('active')

      const searchItems = await searchByTitle(licenseTitle)
      expect(searchItems.some((item) => item.id === licenseRequiredPropertyId)).toBe(true)
   })

   it('edge: admin activation is rejected when the host KYC is not verified', async () => {
      const res = await patchStatus(adminToken, unverifiedHostPropertyId, 'active')
      expect(res.status).toBe(403)
      const error = res.body as ErrorBody
      expect(error.errorCode).toBe('HOST_NOT_VERIFIED')

      const row = await prisma.properties.findUniqueOrThrow({
         where: { id: unverifiedHostPropertyId }
      })
      expect(row.status).toBe('paused')
      expect(await eventsFor(unverifiedHostPropertyId)).toHaveLength(0)

      // Owner access is identity-based, not KYC-based: the unverified host can
      // still open their own paused listing (e.g. to finish editing it)
      const ownerRes = await getDetail(unverifiedHostPropertyId, hostUnverifiedToken)
      expect(ownerRes.status).toBe(200)
      const ownerBody = ownerRes.body as { data: { property: ListingData } }
      expect(ownerBody.data.property.id).toBe(unverifiedHostPropertyId)
   })

   it('edge: admin endpoint rejects invalid status, missing token and non-admin role without side effects', async () => {
      const eventsBefore = await eventsFor(draftPropertyId)
      const rowBefore = await prisma.properties.findUniqueOrThrow({
         where: { id: draftPropertyId }
      })

      const invalidRes = await patchStatus(adminToken, draftPropertyId, 'draft')
      expect(invalidRes.status).toBe(400)

      const noTokenRes = await patchStatus(null, draftPropertyId, 'paused')
      expect(noTokenRes.status).toBe(401)

      const hostRes = await patchStatus(hostToken, draftPropertyId, 'paused')
      expect(hostRes.status).toBe(403)

      const rowAfter = await prisma.properties.findUniqueOrThrow({ where: { id: draftPropertyId } })
      expect(rowAfter.status).toBe(rowBefore.status)
      expect(await eventsFor(draftPropertyId)).toHaveLength(eventsBefore.length)
   })

   it('edge: repeated same-status updates record each event and never duplicate search documents', async () => {
      const eventsBefore = await eventsFor(draftPropertyId)

      const firstRes = await patchStatus(adminToken, draftPropertyId, 'paused')
      expect(firstRes.status).toBe(200)
      const secondRes = await patchStatus(adminToken, draftPropertyId, 'paused')
      expect(secondRes.status).toBe(200)

      const events = await eventsFor(draftPropertyId)
      expect(events).toHaveLength(eventsBefore.length + 2)
      expect(events[events.length - 2].payload).toEqual({ status: 'paused' })
      expect(events[events.length - 1].payload).toEqual({ status: 'paused' })

      await processOutbox()
      expect(fakeMeili.propertiesIndex.documents.has(draftPropertyId)).toBe(false)

      const activateRes = await patchStatus(adminToken, draftPropertyId, 'active')
      expect(activateRes.status).toBe(200)

      await processOutbox()
      const doc = fakeMeili.propertiesIndex.documents.get(draftPropertyId)
      expect(doc).toBeDefined()
      expect(doc?.status).toBe('active')
   })

   it('edge: worker retries a failed sync and clears the error once it succeeds', async () => {
      const event = await prisma.outbox_events.create({
         data: {
            aggregate_type: 'property',
            aggregate_id: workerEdgePropertyId,
            event_type: 'property.status.changed',
            payload: { status: 'active' },
            status: 'pending'
         }
      })
      workerEventIds.push(event.id)

      // First run fails on the injected meili error, second run completes
      fakeMeili.propertiesIndex.failNextAdd = true
      await processOutbox()

      const failedEvent = await prisma.outbox_events.findUniqueOrThrow({ where: { id: event.id } })
      expect(failedEvent.status).toBe('failed')
      expect(failedEvent.attempts).toBe(1)
      expect(failedEvent.error_message).toContain('injected meili failure')

      await processOutbox()

      const completedEvent = await prisma.outbox_events.findUniqueOrThrow({
         where: { id: event.id }
      })
      expect(completedEvent.status).toBe('completed')
      expect(completedEvent.error_message).toBeNull()
      expect(completedEvent.attempts).toBe(2)

      const doc = fakeMeili.propertiesIndex.documents.get(workerEdgePropertyId)
      expect(doc).toBeDefined()
      expect(doc?.status).toBe('active')
   })

   it('edge: worker skips events that reached the 5-attempt limit until they are reset', async () => {
      const phantomPropertyId = randomUUID()
      const event = await prisma.outbox_events.create({
         data: {
            aggregate_type: 'property',
            aggregate_id: phantomPropertyId,
            event_type: 'property.status.changed',
            payload: { status: 'active' },
            status: 'pending',
            attempts: 5
         }
      })
      workerEventIds.push(event.id)

      await processOutbox()

      const skipped = await prisma.outbox_events.findUniqueOrThrow({ where: { id: event.id } })
      expect(skipped.status).toBe('pending')
      expect(skipped.attempts).toBe(5)

      await prisma.outbox_events.update({ where: { id: event.id }, data: { attempts: 0 } })
      await processOutbox()

      const processed = await prisma.outbox_events.findUniqueOrThrow({ where: { id: event.id } })
      expect(processed.status).toBe('completed')

      // The phantom property does not exist, so the sync must not add a document
      expect(fakeMeili.propertiesIndex.documents.has(phantomPropertyId)).toBe(false)
   })

   it('edge: detail of a nonexistent property returns 404 for anonymous and authenticated actors', async () => {
      const missingId = randomUUID()

      const anonymousRes = await getDetail(missingId)
      expect(anonymousRes.status).toBe(404)

      const adminRes = await getDetail(missingId, adminToken)
      expect(adminRes.status).toBe(404)
   })
})
