import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ROLES_KEY } from '../../../../shared/decorators/authorize.decorator'
import { GlobalSecurityGuard } from '../../../../shared/guards/global-security.guard'
import { TokenServicePort } from '../../../auth/application/ports/token-service.port'
import { AdminKycController } from './admin-kyc.controller'

type AdminKycHandler = AdminKycController['getPendingKyc'] | AdminKycController['reviewKyc']

const handler = (name: 'getPendingKyc' | 'reviewKyc') =>
   Object.getOwnPropertyDescriptor(AdminKycController.prototype, name)?.value as AdminKycHandler

const routeCases = [
   {
      name: 'pending queue',
      handler: handler('getPendingKyc'),
      url: '/admin/kyc/pending'
   },
   {
      name: 'document review',
      handler: handler('reviewKyc'),
      url: '/admin/kyc/review/document-id'
   }
] as const

describe('Admin KYC authorization', () => {
   const buildContext = (routeHandler: AdminKycHandler, url: string, authorization?: string) => ({
      getHandler: () => routeHandler,
      getClass: () => AdminKycController,
      switchToHttp: () => ({
         getRequest: () => ({
            url,
            headers: authorization ? { authorization } : {}
         })
      })
   })

   async function buildGuard(role: 'admin' | 'guest' | 'host') {
      const verifyToken = jest
         .fn()
         .mockResolvedValue({ sub: 'account-id', email: 'user@test.dev', role })
      const module = await Test.createTestingModule({
         providers: [
            GlobalSecurityGuard,
            Reflector,
            { provide: TokenServicePort, useValue: { verifyToken } }
         ]
      }).compile()

      return module.get(GlobalSecurityGuard)
   }

   it.each(routeCases)('declares the admin role on $name', ({ handler: routeHandler }) => {
      expect(Reflect.getMetadata(ROLES_KEY, routeHandler)).toEqual(['admin'])
   })

   it.each(routeCases)('returns 401 without a token on $name', async ({ handler, url }) => {
      const guard = await buildGuard('admin')

      await expect(guard.canActivate(buildContext(handler, url) as never)).rejects.toBeInstanceOf(
         UnauthorizedException
      )
   })

   it.each(
      routeCases.flatMap((route) =>
         (['guest', 'host'] as const).map((role) => ({ ...route, role }))
      )
   )('returns 403 for $role on $name', async ({ handler, url, role }) => {
      const guard = await buildGuard(role)

      await expect(
         guard.canActivate(buildContext(handler, url, 'Bearer token') as never)
      ).rejects.toBeInstanceOf(ForbiddenException)
   })

   it.each(routeCases)('allows an admin on $name', async ({ handler, url }) => {
      const guard = await buildGuard('admin')

      await expect(
         guard.canActivate(buildContext(handler, url, 'Bearer token') as never)
      ).resolves.toBe(true)
   })
})
