import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Account } from '../domain/entities/auth.entity'
import { AccountRepository } from '../domain/repositories/auth.repository'
import { TokenServicePort } from '../application/ports/token-service.port'
import { JwtAuthGuard } from './jwt-auth.guard'

describe('JwtAuthGuard account session validation', () => {
   const request = (authorization = 'Bearer token') => ({
      headers: { authorization },
      user: undefined as { id: string; email: string; role: string } | undefined
   })

   const context = (req: ReturnType<typeof request>) =>
      ({
         switchToHttp: () => ({ getRequest: () => req })
      }) as unknown as ExecutionContext

   const account = (status: 'active' | 'suspended' | 'banned', tokenVersion = 0) =>
      new Account(
         'account-id',
         'user@test.dev',
         null,
         'password-hash',
         'guest',
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
            role: 'guest',
            tokenVersion
         })
      } as unknown as TokenServicePort
      const accountRepository = {
         findById: jest.fn().mockResolvedValue(currentAccount)
      } as unknown as AccountRepository

      return {
         guard: new JwtAuthGuard(tokenService, accountRepository),
         accountRepository
      }
   }

   it('allows an active account with the current token version', async () => {
      const req = request()
      const { guard } = buildGuard(account('active', 2), 2)

      await expect(guard.canActivate(context(req))).resolves.toBe(true)
      expect(req.user).toEqual({
         id: 'account-id',
         email: 'user@test.dev',
         role: 'guest'
      })
   })

   it.each(['suspended', 'banned'] as const)(
      'rejects a %s account even when the JWT signature is valid',
      async (status) => {
         const { guard } = buildGuard(account(status, 1), 1)

         await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(
            UnauthorizedException
         )
      }
   )

   it('rejects a token with a stale token version', async () => {
      const { guard } = buildGuard(account('active', 3), 2)

      await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(
         UnauthorizedException
      )
   })

   it('rejects a legacy token without a token version', async () => {
      const tokenService = {
         verifyToken: jest.fn().mockResolvedValue({
            sub: 'account-id',
            email: 'user@test.dev',
            role: 'guest'
         })
      } as unknown as TokenServicePort
      const accountRepository = {
         findById: jest.fn().mockResolvedValue(account('active', 0))
      } as unknown as AccountRepository
      const guard = new JwtAuthGuard(tokenService, accountRepository)

      await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(
         UnauthorizedException
      )
   })

   it('rejects a token when the account no longer exists', async () => {
      const { guard } = buildGuard(null)

      await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(
         UnauthorizedException
      )
   })
})
