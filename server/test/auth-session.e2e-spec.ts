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

type SignupData = {
   id: string
}

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

describeIfE2eDatabase('Auth session lifecycle (e2e)', () => {
   let app: INestApplication<App>
   let prisma: PrismaService
   let accountId: string
   let adminId: string
   let adminToken: string
   let userToken: string

   const adminEmail = `e2e-admin-${Date.now()}@rentify.test`
   const adminPassword = 'e2e-admin-password-123'
   const userEmail = `e2e-session-${Date.now()}@rentify.test`
   const userPassword = 'e2e-password-123'

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
            password_hash: await bcrypt.hash(adminPassword, 4),
            role: 'admin',
            status: 'active',
            profiles: {
               create: {
                  first_name: 'E2E',
                  last_name: 'Admin'
               }
            }
         }
      })
      adminId = admin.id

      const adminLogin = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: adminEmail, password: adminPassword })
         .expect(201)
      const adminLoginBody = adminLogin.body as ApiResponse<LoginData>
      adminToken = adminLoginBody.data.accessToken

      const signup = await request(app.getHttpServer())
         .post('/auth/signup')
         .send({
            email: userEmail,
            password: userPassword,
            firstName: 'E2E',
            lastName: 'Session'
         })
         .expect(201)
      const signupBody = signup.body as ApiResponse<SignupData>
      accountId = signupBody.data.id

      const login = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: userEmail, password: userPassword })
         .expect(201)
      const loginBody = login.body as ApiResponse<LoginData>
      userToken = loginBody.data.accessToken
   })

   afterAll(async () => {
      if (prisma) {
         if (accountId) {
            await prisma.accounts.delete({ where: { id: accountId } })
         }
         if (adminId) {
            await prisma.accounts.delete({ where: { id: adminId } })
         }
      }
      await app?.close()
   })

   it('invalidates the old token after suspend and allows a new token after reactivation', async () => {
      await request(app.getHttpServer())
         .get('/auth/me')
         .set('Authorization', `Bearer ${userToken}`)
         .expect(200)

      await request(app.getHttpServer())
         .patch(`/admin/accounts/${accountId}/status`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ status: 'suspended' })
         .expect(200)

      await request(app.getHttpServer())
         .get('/auth/me')
         .set('Authorization', `Bearer ${userToken}`)
         .expect(401)

      await request(app.getHttpServer())
         .patch(`/admin/accounts/${accountId}/status`)
         .set('Authorization', `Bearer ${adminToken}`)
         .send({ status: 'active' })
         .expect(200)

      await request(app.getHttpServer())
         .get('/auth/me')
         .set('Authorization', `Bearer ${userToken}`)
         .expect(401)

      const relogin = await request(app.getHttpServer())
         .post('/auth/login')
         .send({ email: userEmail, password: userPassword })
         .expect(201)

      const reloginBody = relogin.body as ApiResponse<LoginData>
      await request(app.getHttpServer())
         .get('/auth/me')
         .set('Authorization', `Bearer ${reloginBody.data.accessToken}`)
         .expect(200)
   })
})
