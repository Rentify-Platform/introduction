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

// In-memory Meilisearch index fake: isolates the external search service while
// the real OutboxProcessor logic (document build/delete) still runs against it.
class FakePropertiesIndex {
   documents = new Map<string, Record<string, any>>()

   updateSettings(): Promise<void> {
      return Promise.resolve()
   }

   addDocuments(documents: Record<string, any>[]): Promise<void> {
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
type ListingData = { id: string; status: string }
type ErrorBody = { errorCode: string; message: string }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Listings Phase 4 admin status <-> Meilisearch sync (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let fakeMeili: FakeMeilisearchService
   let outboxProcessor: OutboxProcessor

   const runId = Date.now()
   const password = 'e2e-password-123'
   const adminEmail = `e2e-p4-admin-${runId}@rentify.test`
   const hostEmail = `e2e-p4-host-${runId}@rentify.test`
   const guestEmail = `e2e-p4-guest-${runId}@rentify.test`
   const uniqueTitle = `Phase4 Search Fixture ${runId}`

   let adminToken: string
   let hostToken: string
   let guestToken: string
   let adminId: string
   let hostId: string
   let guestId: string
   let propertyTypeId: number
   let propertyId: string

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
            profiles: { create: { first_name: firstName, last_name: lastName } },
            ...(role === 'host' ? { host_profiles: { create: { kyc_status: 'verified' } } } : {})
         }
      })
   }

   const login = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password })
      expect(res.status).toBe(201)
      const body = res.body as { data: LoginData }
      return body.data.accessToken
   }

   const patchStatus = (token: string | null, id: string, status: string) =>
      request(app.getHttpServer())
         .patch(`/admin/properties/${id}/status`)
         .set('Authorization', token ? `Bearer ${token}` : '')
         .send({ status })

   const processOutbox = async () => {
      await outboxProcessor.processOutboxEvents()
   }

   const eventsFor = async (id: string) =>
      prisma.outbox_events.findMany({
         where: { aggregate_type: 'property', aggregate_id: id },
         orderBy: { created_at: 'asc' }
      })

   const searchByTitle = async () => {
      const res = await request(app.getHttpServer())
         .get('/properties')
         .query({ query: uniqueTitle })
      expect(res.status).toBe(200)
      const body = res.body as { data: { items: ListingData[] } }
      return body.data.items
   }

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

      const admin = await createAccount(adminEmail, 'admin', 'Phase4', 'Admin')
      adminId = admin.id
      const host = await createAccount(hostEmail, 'host', 'Phase4', 'Host')
      hostId = host.id
      const guest = await createAccount(guestEmail, 'guest', 'Phase4', 'Guest')
      guestId = guest.id

      adminToken = await login(adminEmail)
      hostToken = await login(hostEmail)
      guestToken = await login(guestEmail)

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-p4-type-${runId}`, label: 'E2E Phase 4 Type' }
      })
      propertyTypeId = propertyType.id

      // Created as paused directly (no outbox event) so the index starts empty
      // and the admin flow under test drives every status transition
      const property = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: hostId,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'paused',
            title: uniqueTitle,
            address_line1: '1 Search Regression Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 4,
            base_price_cents: 1500000n,
            cancellation_policy_code: 'moderate'
         }
      })
      propertyId = property.id
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
         await safe(() =>
            prisma.outbox_events.deleteMany({
               where: { aggregate_type: 'property', aggregate_id: propertyId }
            })
         )
         await safe(() => prisma.properties.deleteMany({ where: { id: propertyId } }))
         await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         await safe(() =>
            prisma.accounts.deleteMany({ where: { id: { in: [adminId, hostId, guestId] } } })
         )
      }
      await app?.close()
   })

   it('control case: admin activation indexes the listing and makes it searchable and publicly viewable', async () => {
      const res = await patchStatus(adminToken, propertyId, 'active')
      expect(res.status).toBe(200)
      const body = res.body as { data: ListingData }
      expect(body.data.status).toBe('active')

      const row = await prisma.properties.findUniqueOrThrow({ where: { id: propertyId } })
      expect(row.status).toBe('active')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(propertyId)
      expect(events).toHaveLength(1)
      expect(events[0].event_type).toBe('property.status.changed')
      expect(events[0].payload).toEqual({ status: 'active' })
      expect(events[0].status).toBe('pending')

      await processOutbox()

      const eventsAfter = await eventsFor(propertyId)
      expect(eventsAfter[0].status).toBe('completed')

      const doc = fakeMeili.propertiesIndex.documents.get(propertyId)
      expect(doc).toBeDefined()
      expect(doc?.status).toBe('active')
      expect(doc?.title).toBe(uniqueTitle)
      expect(doc?.price_cents).toBe(1500000)

      const searchItems = await searchByTitle()
      expect(searchItems.some((item) => item.id === propertyId)).toBe(true)

      const detailRes = await request(app.getHttpServer()).get(`/properties/detail/${propertyId}`)
      expect(detailRes.status).toBe(200)
      const detailBody = detailRes.body as { data: { property: ListingData } }
      expect(detailBody.data.property.id).toBe(propertyId)

      const basicRes = await request(app.getHttpServer()).get(`/properties/${propertyId}`)
      expect(basicRes.status).toBe(200)
      const basicBody = basicRes.body as { data: ListingData }
      expect(basicBody.data.id).toBe(propertyId)
   })

   it('paused listing disappears from search after the worker processes the event and public detail is hidden', async () => {
      const res = await patchStatus(adminToken, propertyId, 'paused')
      expect(res.status).toBe(200)
      const body = res.body as { data: ListingData }
      expect(body.data.status).toBe('paused')

      const row = await prisma.properties.findUniqueOrThrow({ where: { id: propertyId } })
      expect(row.status).toBe('paused')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(propertyId)
      expect(events).toHaveLength(2)
      expect(events[1].payload).toEqual({ status: 'paused' })
      expect(events[1].status).toBe('pending')

      await processOutbox()
      expect((await eventsFor(propertyId))[1].status).toBe('completed')
      expect(fakeMeili.propertiesIndex.documents.has(propertyId)).toBe(false)

      const searchItems = await searchByTitle()
      expect(searchItems.some((item) => item.id === propertyId)).toBe(false)

      const detailRes = await request(app.getHttpServer()).get(`/properties/detail/${propertyId}`)
      expect(detailRes.status).toBe(404)
      const detailError = detailRes.body as ErrorBody
      expect(detailError.errorCode).toBe('PROPERTY_NOT_FOUND')

      const basicRes = await request(app.getHttpServer()).get(`/properties/${propertyId}`)
      expect(basicRes.status).toBe(404)

      const guestDetailRes = await request(app.getHttpServer())
         .get(`/properties/detail/${propertyId}`)
         .set('Authorization', `Bearer ${guestToken}`)
      expect(guestDetailRes.status).toBe(404)

      // Control cases: owner host and admin keep access (host edit page relies on it)
      const hostDetailRes = await request(app.getHttpServer())
         .get(`/properties/detail/${propertyId}`)
         .set('Authorization', `Bearer ${hostToken}`)
      expect(hostDetailRes.status).toBe(200)
      const hostBody = hostDetailRes.body as { data: { property: ListingData } }
      expect(hostBody.data.property.id).toBe(propertyId)

      const adminDetailRes = await request(app.getHttpServer())
         .get(`/properties/detail/${propertyId}`)
         .set('Authorization', `Bearer ${adminToken}`)
      expect(adminDetailRes.status).toBe(200)
   })

   it('archived listing stays out of search, sets deleted_at and hides public detail', async () => {
      const res = await patchStatus(adminToken, propertyId, 'archived')
      expect(res.status).toBe(200)
      const body = res.body as { data: ListingData }
      expect(body.data.status).toBe('archived')

      const row = await prisma.properties.findUniqueOrThrow({ where: { id: propertyId } })
      expect(row.status).toBe('archived')
      expect(row.deleted_at).not.toBeNull()

      const events = await eventsFor(propertyId)
      expect(events).toHaveLength(3)
      expect(events[2].payload).toEqual({ status: 'archived' })

      await processOutbox()
      expect((await eventsFor(propertyId))[2].status).toBe('completed')
      expect(fakeMeili.propertiesIndex.documents.has(propertyId)).toBe(false)

      const searchItems = await searchByTitle()
      expect(searchItems.some((item) => item.id === propertyId)).toBe(false)

      const detailRes = await request(app.getHttpServer()).get(`/properties/detail/${propertyId}`)
      expect(detailRes.status).toBe(404)

      const hostDetailRes = await request(app.getHttpServer())
         .get(`/properties/detail/${propertyId}`)
         .set('Authorization', `Bearer ${hostToken}`)
      expect(hostDetailRes.status).toBe(200)
   })

   it('re-activation overwrites stale index documents with fresh database data', async () => {
      // Simulate a stale document left in the index while the listing is paused
      fakeMeili.propertiesIndex.documents.set(propertyId, {
         id: propertyId,
         title: 'STALE TITLE',
         status: 'paused'
      })

      const res = await patchStatus(adminToken, propertyId, 'active')
      expect(res.status).toBe(200)

      await processOutbox()

      const doc = fakeMeili.propertiesIndex.documents.get(propertyId)
      expect(doc).toBeDefined()
      expect(doc?.title).toBe(uniqueTitle)
      expect(doc?.status).toBe('active')

      const searchItems = await searchByTitle()
      expect(searchItems.some((item) => item.id === propertyId)).toBe(true)

      const detailRes = await request(app.getHttpServer()).get(`/properties/detail/${propertyId}`)
      expect(detailRes.status).toBe(200)
   })

   it('rejects unrelated actor and missing property on the admin status endpoint without side effects', async () => {
      const eventsBefore = await eventsFor(propertyId)

      const guestRes = await patchStatus(guestToken, propertyId, 'archived')
      expect(guestRes.status).toBe(403)

      const missingRes = await patchStatus(adminToken, randomUUID(), 'active')
      expect(missingRes.status).toBe(404)
      const missingError = missingRes.body as ErrorBody
      expect(missingError.errorCode).toBe('PROPERTY_NOT_FOUND')

      const row = await prisma.properties.findUniqueOrThrow({ where: { id: propertyId } })
      expect(row.status).toBe('active')
      expect(await eventsFor(propertyId)).toHaveLength(eventsBefore.length)
   })
})
