import { HttpStatus } from '@nestjs/common'
import { Account } from '../../domain/entities/auth.entity'
import {
   AccountNotFoundException,
   AdminAccountStatusProtectedException
} from '../../domain/errors/auth.errors'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import {
   UpdateAccountStatusCommand,
   UpdateAccountStatusUseCase
} from './update-account-status.usecase'

describe('UpdateAccountStatusUseCase', () => {
   const findById = jest.fn()
   const updateStatus = jest.fn()
   let useCase: UpdateAccountStatusUseCase

   const account = (id: string, role: 'guest' | 'host' | 'admin') =>
      new Account(
         id,
         `${id}@example.com`,
         null,
         'password-hash',
         role,
         'active',
         'Test',
         'Account',
         new Date('2026-08-20T00:00:00.000Z'),
         new Date('2026-08-20T00:00:00.000Z')
      )

   beforeEach(() => {
      jest.clearAllMocks()
      const repository = {
         findByEmail: jest.fn(),
         findById,
         save: jest.fn(),
         existsByEmail: jest.fn(),
         findAll: jest.fn(),
         updateStatus
      } as jest.Mocked<AccountRepository>
      useCase = new UpdateAccountStatusUseCase(repository)
   })

   it.each([
      ['guest', 'guest-account'],
      ['host', 'host-account']
   ] as const)('updates a %s account', async (role, accountId) => {
      const existing = account(accountId, role)
      const updated = new Account(
         existing.id,
         existing.email,
         existing.phone,
         existing.passwordHash,
         existing.role,
         'suspended',
         existing.firstName,
         existing.lastName,
         existing.createdAt,
         new Date('2026-08-21T00:00:00.000Z')
      )
      findById.mockResolvedValue(existing)
      updateStatus.mockResolvedValue(updated)

      await expect(
         useCase.execute(new UpdateAccountStatusCommand(accountId, 'suspended'))
      ).resolves.toBe(updated)
      expect(updateStatus).toHaveBeenCalledWith(accountId, 'suspended')
   })

   it.each([
      ['the caller own admin account', 'current-admin'],
      ['another admin account', 'other-admin']
   ])('rejects %s with 403 and does not persist', async (_scenario, accountId) => {
      findById.mockResolvedValue(account(accountId, 'admin'))

      const result = useCase.execute(new UpdateAccountStatusCommand(accountId, 'banned'))

      await expect(result).rejects.toBeInstanceOf(AdminAccountStatusProtectedException)
      await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN })
      expect(updateStatus).not.toHaveBeenCalled()
   })

   it('returns not found without attempting persistence', async () => {
      findById.mockResolvedValue(null)

      await expect(
         useCase.execute(new UpdateAccountStatusCommand('missing-account', 'suspended'))
      ).rejects.toBeInstanceOf(AccountNotFoundException)
      expect(updateStatus).not.toHaveBeenCalled()
   })
})
