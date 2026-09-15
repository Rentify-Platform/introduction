import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

type ApiResponse<T> = { success: boolean; message: string; data: T }
type LoginData = { accessToken: string }
type SignupData = { id: string }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Admin penalties (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let adminId: string
   let hostId: string
   let guestId: string
   let adminToken: string
   let guestToken: string
   let createdPenaltyId: string | undefined

   const password = 'e2e-penalty-password-123'
   const adminEmail = `e2e-penalty-admin-${Date.now()}@rentify.test`
   const hostEmail = `e2e-penalty-host-${Date.now()}@rentify.test`
   const guestEmail = `e2e-penalty-guest-${Date.now()}@rentify.test`

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl
      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
      }).compile()
      app = moduleFixture.createNestApplication()
      await app.init()
      prisma = app.get(PrismaService)

      const admin = await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: adminEmail,
            password_hash: await bcrypt.hash(password, 4),
            role: 'admin',
            status: 'active',
            profiles: { create: { first_name: 'E2E', last_name: 'Penalty Admin' } }
         }
      })
      adminId = admin.id
      await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: hostEmail,
            password_hash: await bcrypt.hash(password, 4),
            role: 'host',
            status: 'active',
            profiles: { create: { first_name: 'E2E', last_name: 'Penalty Host' } },
            host_profiles: { create: {} }
         }
      })
      hostId = (await prisma.accounts.findUniqueOrThrow({ where: { email: hostEmail } })).id

      const adminLogin = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: adminEmail, password })
         .expect(201)
      adminToken = (adminLogin.body as ApiResponse<LoginData>).data.accessToken

      const signup = await request(app.getHttpServer())
         .post('/auth/signup')
         .send({ email: guestEmail, password, firstName: 'E2E', lastName: 'Penalty Guest' })
         .expect(201)
      guestId = (signup.body as ApiResponse<SignupData>).data.id
      const guestLogin = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: guestEmail, password })
         .expect(201)
      guestToken = (guestLogin.body as ApiResponse<LoginData>).data.accessToken
   })

   afterAll(async () => {
      if (prisma) {
         if (createdPenaltyId) {
            await prisma.host_penalties
               .delete({ where: { id: createdPenaltyId } })
               .catch(() => undefined)
         }
         if (guestId) await prisma.accounts.delete({ where: { id: guestId } })
         if (hostId) await prisma.accounts.delete({ where: { id: hostId } })
         if (adminId) await prisma.accounts.delete({ where: { id: adminId } })
      }
      await app?.close()
   })

   it('allows admin to create and void a valid penalty for a host without a booking', async () => {
      const created = await request(app.getHttpServer())
         .post('/admin/penalties')
         .set('Authorization', `Bearer ${adminToken}`)
         .send({
            hostId,
            penaltyType: 'host_cancellation',
            amountCents: 50000,
            notes: 'documented'
         })
         .expect(201)
      createdPenaltyId = (created.body as ApiResponse<{ id: string }>).data.id

      const row = await prisma.host_penalties.findUniqueOrThrow({ where: { id: createdPenaltyId } })
      expect(row.host_id).toBe(hostId)
      expect(row.booking_id).toBeNull()
      expect(row.amount_cents).toBe(BigInt(50000))

      await request(app.getHttpServer())
         .post(`/admin/penalties/${createdPenaltyId}/void`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ reason: 'Created in error during E2E' })
         .expect(201)
      const voided = await prisma.host_penalties.findUnique({ where: { id: createdPenaltyId } })
      expect(voided).toMatchObject({
         status: 'voided',
         void_reason: 'Created in error during E2E',
         voided_by_admin_id: adminId
      })

      await request(app.getHttpServer())
         .post(`/admin/penalties/${createdPenaltyId}/void`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ reason: 'Duplicate request' })
         .expect(400)

      const afterDuplicate = await prisma.host_penalties.findUnique({
         where: { id: createdPenaltyId }
      })
      expect(afterDuplicate).toMatchObject({
         status: 'voided',
         void_reason: 'Created in error during E2E',
         voided_by_admin_id: adminId
      })
   })

   it('rejects invalid penalty payloads without creating rows', async () => {
      const before = await prisma.host_penalties.count()
      await request(app.getHttpServer())
         .post('/admin/penalties')
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ hostId, penaltyType: 'unknown', amountCents: 50000 })
         .expect(400)
      await request(app.getHttpServer())
         .post('/admin/penalties')
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ hostId, penaltyType: 'host_cancellation', amountCents: 1.5 })
         .expect(400)
      await request(app.getHttpServer())
         .post(`/admin/penalties/${randomUUID()}/void`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ reason: '   ' })
         .expect(400)
      expect(await prisma.host_penalties.count()).toBe(before)
   })

   it('rejects a non-host account and a guest actor without side effects', async () => {
      const before = await prisma.host_penalties.count()
      await request(app.getHttpServer())
         .post('/admin/penalties')
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ hostId: guestId, penaltyType: 'host_cancellation', amountCents: 100 })
         .expect(400)
      await request(app.getHttpServer())
         .post('/admin/penalties')
         .set('Authorization', `Bearer ${guestToken}`)
         .send({ hostId, penaltyType: 'host_cancellation', amountCents: 100 })
         .expect(403)
      expect(await prisma.host_penalties.count()).toBe(before)
   })

   it('returns 404 when deleting a missing penalty', async () => {
      await request(app.getHttpServer())
         .post(`/admin/penalties/${randomUUID()}/void`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ reason: 'Missing penalty' })
         .expect(404)
   })
})
