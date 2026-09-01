import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ROLES_KEY } from '../../../../shared/decorators/authorize.decorator'
import { GlobalSecurityGuard } from '../../../../shared/guards/global-security.guard'
import { TokenServicePort } from '../../../auth/application/ports/token-service.port'
import { AdminListingsController } from './admin-listings.controller'

type AdminListingsHandler =
   | AdminListingsController['listProperties']
   | AdminListingsController['getPropertyLicense']
   | AdminListingsController['updatePropertyStatus']

const handler = (name: 'listProperties' | 'getPropertyLicense' | 'updatePropertyStatus') =>
   Object.getOwnPropertyDescriptor(AdminListingsController.prototype, name)
      ?.value as AdminListingsHandler

const routeCases = [
   {
      name: 'property list',
      handler: handler('listProperties'),
      url: '/admin/properties'
   },
   {
      name: 'property license',
      handler: handler('getPropertyLicense'),
      url: '/admin/properties/property-id/license'
   },
   {
      name: 'property status',
      handler: handler('updatePropertyStatus'),
      url: '/admin/properties/property-id/status'
   }
] as const

describe('Admin listings authorization', () => {
   const buildContext = (
      routeHandler: AdminListingsHandler,
      url: string,
      authorization?: string
   ) => ({
      getHandler: () => routeHandler,
      getClass: () => AdminListingsController,
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
