import { Account } from '../../domain/entities/auth.entity'
import { AuthPrismaRepository } from './auth.prisma.repository'

describe('AuthPrismaRepository token version persistence', () => {
   const account = new Account(
      'account-id',
      'user@test.dev',
      null,
      'password-hash',
      'guest',
      'active',
      'Test',
      'User',
      new Date('2026-08-20T00:00:00.000Z'),
      new Date('2026-08-20T00:00:00.000Z'),
      null,
      null,
      null,
      'unverified',
      4
   )

   it('does not overwrite token_version when saving an existing account', async () => {
      const accountUpsert = jest.fn().mockResolvedValue(undefined)
      const profileUpsert = jest.fn().mockResolvedValue(undefined)
      const prisma = {
         $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
            callback({
               accounts: { upsert: accountUpsert },
               profiles: { upsert: profileUpsert }
            })
         )
      }
      const repository = new AuthPrismaRepository(prisma as never)

      await repository.save(account)

      const [payload] = accountUpsert.mock.calls[0] as [
         { update: Record<string, unknown>; create: Record<string, unknown> }
      ]
      expect(payload.update).not.toHaveProperty('token_version')
      expect(payload.create.token_version).toBe(4)
   })

   it('increments token_version atomically when account status changes', async () => {
      const accountUpdate = jest.fn().mockResolvedValue({
         id: account.id,
         email: account.email,
         phone: account.phone,
         password_hash: account.passwordHash,
         role: account.role,
         status: 'suspended',
         token_version: 5,
         created_at: account.createdAt,
         updated_at: new Date('2026-08-21T00:00:00.000Z'),
         profiles: null
      })
      const prisma = {
         accounts: { update: accountUpdate }
      }
      const repository = new AuthPrismaRepository(prisma as never)

      await repository.updateStatus(account.id, 'suspended')

      const [payload] = accountUpdate.mock.calls[0] as [
         {
            where: { id: string }
            data: {
               status: string
               token_version: { increment: number }
               updated_at: Date
            }
         }
      ]
      expect(payload.where).toEqual({ id: account.id })
      expect(payload.data.status).toBe('suspended')
      expect(payload.data.token_version).toEqual({ increment: 1 })
      expect(payload.data.updated_at).toBeInstanceOf(Date)
   })
})
