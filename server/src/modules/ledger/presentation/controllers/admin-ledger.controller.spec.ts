import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ROLES_KEY } from '../../../../shared/decorators/authorize.decorator'
import { GlobalSecurityGuard } from '../../../../shared/guards/global-security.guard'
import { TokenServicePort } from '../../../auth/application/ports/token-service.port'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { AdminLedgerController } from './admin-ledger.controller'

const getPlatformBalanceHandler = Object.getOwnPropertyDescriptor(
   AdminLedgerController.prototype,
   'getPlatformBalance'
)?.value as AdminLedgerController['getPlatformBalance']

describe('AdminLedgerController', () => {
   const executeGetBalance = jest.fn()
   const getBalanceUseCase = { execute: executeGetBalance }

   beforeEach(() => jest.clearAllMocks())

   it('uses the fixed platform/revenue/VND selector', async () => {
      executeGetBalance.mockResolvedValue(
         new LedgerBalance('platform-account', 125000n, new Date('2026-08-20T00:00:00.000Z'))
      )
      const controller = new AdminLedgerController(getBalanceUseCase as never)

      const result = await controller.getPlatformBalance()

      expect(executeGetBalance).toHaveBeenCalledWith(
         expect.objectContaining({
            ledgerAccountId: null,
            ownerType: 'platform',
            ownerAccountId: null,
            accountSubtype: 'revenue',
            currency: 'VND'
         })
      )
      expect(result.data).toEqual(
         expect.objectContaining({ balanceCents: '125000', currency: 'VND' })
      )
   })

   it('declares the admin role on the route', () => {
      expect(Reflect.getMetadata(ROLES_KEY, getPlatformBalanceHandler)).toEqual(['admin'])
   })
})

describe('Admin ledger authorization', () => {
   const buildContext = (authorization?: string) => ({
      getHandler: () => getPlatformBalanceHandler,
      getClass: () => AdminLedgerController,
      switchToHttp: () => ({
         getRequest: () => ({
            url: '/admin/ledger/platform-balance',
            headers: authorization ? { authorization } : {}
         })
      })
   })

   async function buildGuard(role: 'admin' | 'guest' | 'host') {
      const verifyToken = jest
         .fn()
         .mockResolvedValue({ sub: 'account-id', email: 'user@test.dev', role })
      const tokenService = { verifyToken }
      const module = await Test.createTestingModule({
         providers: [
            GlobalSecurityGuard,
            Reflector,
            { provide: TokenServicePort, useValue: tokenService }
         ]
      }).compile()
      return module.get(GlobalSecurityGuard)
   }

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

   it('allows an admin', async () => {
      const guard = await buildGuard('admin')
      await expect(guard.canActivate(buildContext('Bearer token') as never)).resolves.toBe(true)
   })
})
