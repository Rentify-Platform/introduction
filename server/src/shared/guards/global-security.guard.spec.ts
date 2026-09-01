import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Account } from '../../modules/auth/domain/entities/auth.entity'
import { AccountRepository } from '../../modules/auth/domain/repositories/auth.repository'
import { TokenServicePort } from '../../modules/auth/application/ports/token-service.port'
import { GlobalSecurityGuard } from './global-security.guard'

describe('GlobalSecurityGuard account session validation', () => {
   const handler = () => undefined
   const context = (request: { url: string; headers: { authorization?: string } }) =>
      ({
         getHandler: () => handler,
         getClass: () => class TestController {},
         switchToHttp: () => ({ getRequest: () => request })
      }) as unknown as ExecutionContext

   const account = (
      status: 'active' | 'suspended',
      tokenVersion: number,
      role: 'guest' | 'host' | 'admin' = 'admin'
   ) =>
      new Account(
         'account-id',
         'user@test.dev',
         null,
         'password-hash',
         role,
         status,
         'Test',
         'User',
         new Date('2026-08-20T00:00:00.000Z'),
         new Date('2026-08-20T00:00:00.000Z'),
         null,
         null,
         null,
         'unverified',
         tokenVersion
      )

   const buildGuard = (currentAccount: Account | null, tokenVersion = 0) => {
      const tokenService = {
         verifyToken: jest.fn().mockResolvedValue({
            sub: 'account-id',
            email: 'user@test.dev',
            role: 'admin',
            tokenVersion
         })
      } as unknown as TokenServicePort
      const accountRepository = {
         findById: jest.fn().mockResolvedValue(currentAccount)
      } as unknown as AccountRepository

      return new GlobalSecurityGuard(new Reflector(), tokenService, accountRepository)
   }

   const protectedRequest = () => ({
      url: '/admin/private',
      headers: { authorization: 'Bearer token' }
   })

   it('allows an active account with the current token version', async () => {
      await expect(
         buildGuard(account('active', 2), 2).canActivate(context(protectedRequest()))
      ).resolves.toBe(true)
   })

   it('rejects a suspended account on a protected route', async () => {
      await expect(
         buildGuard(account('suspended', 1), 1).canActivate(context(protectedRequest()))
      ).rejects.toBeInstanceOf(UnauthorizedException)
   })

   it('rejects a stale token version on a protected route', async () => {
      await expect(
         buildGuard(account('active', 3), 2).canActivate(context(protectedRequest()))
      ).rejects.toBeInstanceOf(UnauthorizedException)
   })
})
