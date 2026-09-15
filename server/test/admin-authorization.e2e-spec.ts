import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

type ApiResponse<T> = {
   success: boolean
   message: string
   data: T
}

type LoginData = { accessToken: string }
type SignupData = { id: string }

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Admin authorization matrix (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let adminId: string
   let guestId: string
   let adminToken: string
   let guestToken: string

   const adminEmail = `e2e-admin-auth-${Date.now()}@rentify.test`
   const guestEmail = `e2e-guest-auth-${Date.now()}@rentify.test`
   const password = 'e2e-admin-auth-password-123'

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
            profiles: { create: { first_name: 'E2E', last_name: 'Admin Auth' } }
         }
      })
      adminId = admin.id

      const adminLogin = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: adminEmail, password })
         .expect(201)
      adminToken = (adminLogin.body as ApiResponse<LoginData>).data.accessToken

      const signup = await request(app.getHttpServer())
         .post('/auth/signup')
         .send({
            email: guestEmail,
            password,
            firstName: 'E2E',
            lastName: 'Guest Auth'
         })
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
         if (guestId) await prisma.accounts.delete({ where: { id: guestId } })
         if (adminId) await prisma.accounts.delete({ where: { id: adminId } })
      }
      await app?.close()
   })

   it.each([
      '/admin/accounts',
      '/admin/bookings',
      '/admin/cancellations',
      '/admin/hosts',
      '/admin/kyc/pending',
      '/admin/ledger/balances',
      '/admin/ledger/config',
      '/admin/penalties',
      '/admin/properties',
      '/admin/stats/overview'
   ])('rejects unauthenticated access to %s with 401', async (path) => {
      await request(app.getHttpServer()).get(path).expect(401)
   })

   it.each([
      '/admin/accounts',
      '/admin/bookings',
      '/admin/cancellations',
      '/admin/hosts',
      '/admin/kyc/pending',
      '/admin/ledger/balances',
      '/admin/ledger/config',
      '/admin/penalties',
      '/admin/properties',
      '/admin/stats/overview'
   ])('rejects guest access to %s with 403 and no mutation', async (path) => {
      await request(app.getHttpServer())
         .get(path)
         .set('Authorization', `Bearer ${guestToken}`)
         .expect(403)
   })

   it('allows an active admin to access representative Admin read routes', async () => {
      await request(app.getHttpServer())
         .get('/admin/accounts')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)

      await request(app.getHttpServer())
         .get('/admin/stats/overview')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)

      await request(app.getHttpServer())
         .get('/admin/ledger/config')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200)
   })

   it('protects the nested admin sync route even though its path does not start with /admin', async () => {
      await request(app.getHttpServer()).post('/properties/admin/sync-all').expect(401)

      await request(app.getHttpServer())
         .post('/properties/admin/sync-all')
         .set('Authorization', `Bearer ${guestToken}`)
         .expect(403)
   })
})
