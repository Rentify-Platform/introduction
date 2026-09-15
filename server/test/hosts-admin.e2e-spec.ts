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

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Admin hosts (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let adminId: string
   let hostId: string
   let adminToken: string

   const password = 'e2e-host-password-123'
   const adminEmail = `e2e-host-admin-${Date.now()}@rentify.test`
   const hostEmail = `e2e-host-target-${Date.now()}@rentify.test`

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
            profiles: { create: { first_name: 'E2E', last_name: 'Host Admin' } }
         }
      })
      adminId = admin.id
      const host = await prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: hostEmail,
            password_hash: await bcrypt.hash(password, 4),
            role: 'host',
            status: 'active',
            profiles: { create: { first_name: 'E2E', last_name: 'Host Target' } },
            host_profiles: { create: {} }
         }
      })
      hostId = host.id

      const login = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: adminEmail, password })
         .expect(201)
      adminToken = (login.body as ApiResponse<LoginData>).data.accessToken
   })

   afterAll(async () => {
      if (prisma) {
         if (hostId) await prisma.accounts.delete({ where: { id: hostId } })
         if (adminId) await prisma.accounts.delete({ where: { id: adminId } })
      }
      await app?.close()
   })

   it('requires a reason and records admin actor when toggling superhost', async () => {
      await request(app.getHttpServer())
         .patch(`/admin/hosts/${hostId}/superhost`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ isSuperhost: true })
         .expect(400)

      await request(app.getHttpServer())
         .patch(`/admin/hosts/${hostId}/superhost`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ isSuperhost: true, reason: 'Requirements reviewed' })
         .expect(200)

      const profile = await prisma.host_profiles.findUniqueOrThrow({
         where: { account_id: hostId }
      })
      expect(profile.is_superhost).toBe(true)
      expect(profile.superhost_update_reason).toBe('Requirements reviewed')
      expect(profile.superhost_updated_by_admin_id).toBe(adminId)
   })

   it('rejects inactive target hosts without changing superhost state', async () => {
      await prisma.accounts.update({ where: { id: hostId }, data: { status: 'suspended' } })

      await request(app.getHttpServer())
         .patch(`/admin/hosts/${hostId}/superhost`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ isSuperhost: false, reason: 'Suspended account' })
         .expect(400)

      const profile = await prisma.host_profiles.findUniqueOrThrow({
         where: { account_id: hostId }
      })
      expect(profile.is_superhost).toBe(true)
   })
})
