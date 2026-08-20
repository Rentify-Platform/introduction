import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ROLES_KEY } from '../../../../shared/decorators/authorize.decorator'
import { GlobalSecurityGuard } from '../../../../shared/guards/global-security.guard'
import { TokenServicePort } from '../../application/ports/token-service.port'
import { AdminAccountsController } from './admin-accounts.controller'

const updateAccountStatusHandler = Object.getOwnPropertyDescriptor(
   AdminAccountsController.prototype,
   'updateAccountStatus'
)?.value as AdminAccountsController['updateAccountStatus']

describe('Admin account status authorization', () => {
   const buildContext = (authorization?: string) => ({
      getHandler: () => updateAccountStatusHandler,
      getClass: () => AdminAccountsController,
      switchToHttp: () => ({
         getRequest: () => ({
            url: '/admin/accounts/account-id/status',
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

   it('declares the admin role on the status route', () => {
      expect(Reflect.getMetadata(ROLES_KEY, updateAccountStatusHandler)).toEqual(['admin'])
   })

   it('returns 401 when the token is missing', async () => {
      const guard = await buildGuard('admin')

      await expect(guard.canActivate(buildContext() as never)).rejects.toBeInstanceOf(
         UnauthorizedException
      )
   })

   it.each(['guest', 'host'] as const)('returns 403 for %s', async (role) => {
      const guard = await buildGuard(role)

      await expect(guard.canActivate(buildContext('Bearer token') as never)).rejects.toBeInstanceOf(
         ForbiddenException
      )
   })

   it('allows an admin through to the controller', async () => {
      const guard = await buildGuard('admin')

      await expect(guard.canActivate(buildContext('Bearer token') as never)).resolves.toBe(true)
   })
})
