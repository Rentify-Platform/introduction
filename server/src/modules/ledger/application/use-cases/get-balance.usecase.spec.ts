import { Test, TestingModule } from '@nestjs/testing'
import { GetBalanceActor, GetBalanceCommand, GetBalanceUseCase } from './get-balance.usecase'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { LedgerAccount } from '../../domain/entities/ledger-account.entity'
import {
   LedgerAccountForbiddenException,
   LedgerAccountNotFoundException
} from '../../domain/errors/ledger.errors'

describe('GetBalanceUseCase', () => {
   let useCase: GetBalanceUseCase
   let repository: jest.Mocked<LedgerRepository>

   const adminActor = GetBalanceActor.fromAuthenticatedUser({ id: 'admin-1', role: 'admin' })
   const guestActor = GetBalanceActor.fromAuthenticatedUser({ id: 'guest-1', role: 'guest' })
   const hostActor = GetBalanceActor.fromAuthenticatedUser({ id: 'host-1', role: 'host' })

   const personalAccount = (overrides?: {
      id?: string
      ownerType?: 'host' | 'guest'
      ownerAccountId?: string | null
   }) =>
      LedgerAccount.create({
         id: overrides?.id ?? 'own-account-uuid',
         ownerType: overrides?.ownerType ?? 'guest',
         ownerAccountId: overrides?.ownerAccountId ?? 'guest-1',
         accountSubtype: 'clearing',
         currency: 'VND'
      })

   beforeEach(async () => {
      const mockRepository = {
         findTransactionByIdempotencyKey: jest.fn(),
         getOrCreateAccount: jest.fn(),
         saveTransaction: jest.fn(),
         findAccountById: jest.fn(),
         findAccount: jest.fn(),
         saveAccount: jest.fn(),
         findBalance: jest.fn(),
         findBalanceByAccount: jest.fn(),
         findTransactionById: jest.fn(),
         findEntriesByAccountId: jest.fn()
      }

      const module: TestingModule = await Test.createTestingModule({
         providers: [
            GetBalanceUseCase,
            {
               provide: LedgerRepository,
               useValue: mockRepository
            }
         ]
      }).compile()

      useCase = module.get<GetBalanceUseCase>(GetBalanceUseCase)
      repository = module.get(LedgerRepository)
   })

   describe('unrestricted actors (admin, system)', () => {
      it('admin retrieves balance by account ID successfully', async () => {
         const expectedBalance = new LedgerBalance('account-uuid', 25000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(
            'account-uuid',
            null,
            null,
            null,
            null,
            adminActor
         )
         const result = await useCase.execute(command)

         expect(result).toBe(expectedBalance)
         expect(repository.findBalance).toHaveBeenCalledWith('account-uuid')
      })

      it('admin retrieves balance by owner selector and creates account if missing', async () => {
         repository.findAccount.mockResolvedValue(null)
         const createdAccount = LedgerAccount.create({
            id: 'new-account-uuid',
            ownerType: 'host',
            ownerAccountId: 'host-uuid',
            accountSubtype: 'payable',
            currency: 'VND'
         })
         repository.getOrCreateAccount.mockResolvedValue(createdAccount)

         const command = new GetBalanceCommand(
            null,
            'host',
            'host-uuid',
            'payable',
            'VND',
            adminActor
         )
         const result = await useCase.execute(command)

         expect(result.ledgerAccountId).toBe('new-account-uuid')
         expect(result.balanceCents).toBe(0n)
         expect(repository.getOrCreateAccount).toHaveBeenCalledWith(
            'host',
            'host-uuid',
            'payable',
            'VND'
         )
      })

      it('admin can read a personal account owned by another user (management scope)', async () => {
         const foreignAccount = personalAccount({
            id: 'victim-account-uuid',
            ownerAccountId: 'guest-victim'
         })
         repository.findAccountById.mockResolvedValue(foreignAccount)
         const expectedBalance = new LedgerBalance('victim-account-uuid', 50000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(
            'victim-account-uuid',
            null,
            null,
            null,
            null,
            adminActor
         )
         const result = await useCase.execute(command)

         expect(result).toBe(expectedBalance)
      })

      it('system actor (internal flows like tax remittance) reads platform accounts without ownership limits', async () => {
         repository.findAccount.mockResolvedValue(null)
         const platformAccount = LedgerAccount.create({
            id: 'platform-tax-uuid',
            ownerType: 'platform',
            ownerAccountId: null,
            accountSubtype: 'tax_payable_vn',
            currency: 'VND'
         })
         repository.getOrCreateAccount.mockResolvedValue(platformAccount)

         const command = new GetBalanceCommand(
            null,
            'platform',
            null,
            'tax_payable_vn',
            'VND',
            GetBalanceActor.system()
         )
         const result = await useCase.execute(command)

         expect(result.ledgerAccountId).toBe('platform-tax-uuid')
         expect(result.balanceCents).toBe(0n)
         expect(repository.getOrCreateAccount).toHaveBeenCalledWith(
            'platform',
            null,
            'tax_payable_vn',
            'VND'
         )
      })
   })

   describe('personal actor scope (guest/host)', () => {
      it('guest reads own balance via owner selector even when ownerAccountId is omitted', async () => {
         const ownAccount = personalAccount({ id: 'guest-account-uuid' })
         repository.findAccount.mockResolvedValue(ownAccount)
         const expectedBalance = new LedgerBalance('guest-account-uuid', 50000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(null, 'guest', null, 'clearing', 'VND', guestActor)
         const result = await useCase.execute(command)

         expect(result).toBe(expectedBalance)
         expect(repository.findAccount).toHaveBeenCalledWith('guest', 'guest-1', 'clearing', 'VND')
      })

      it('guest providing their own ownerAccountId gets the same account', async () => {
         const ownAccount = personalAccount({ id: 'guest-account-uuid' })
         repository.findAccount.mockResolvedValue(ownAccount)
         const expectedBalance = new LedgerBalance('guest-account-uuid', 50000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(
            null,
            'guest',
            'guest-1',
            'clearing',
            'VND',
            guestActor
         )
         const result = await useCase.execute(command)

         expect(result).toBe(expectedBalance)
         expect(repository.findAccount).toHaveBeenCalledWith('guest', 'guest-1', 'clearing', 'VND')
      })

      it('host reads own balance via owner selector', async () => {
         const ownAccount = LedgerAccount.create({
            id: 'host-account-uuid',
            ownerType: 'host',
            ownerAccountId: 'host-1',
            accountSubtype: 'payable',
            currency: 'VND'
         })
         repository.findAccount.mockResolvedValue(ownAccount)
         const expectedBalance = new LedgerBalance('host-account-uuid', 70000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(null, 'host', 'host-1', 'payable', 'VND', hostActor)
         const result = await useCase.execute(command)

         expect(result.balanceCents).toBe(70000n)
         expect(repository.findAccount).toHaveBeenCalledWith('host', 'host-1', 'payable', 'VND')
      })

      it('guest reads own account by ledgerAccountId', async () => {
         const ownAccount = personalAccount({ id: 'guest-account-uuid' })
         repository.findAccountById.mockResolvedValue(ownAccount)
         const expectedBalance = new LedgerBalance('guest-account-uuid', 50000n, new Date())
         repository.findBalance.mockResolvedValue(expectedBalance)

         const command = new GetBalanceCommand(
            'guest-account-uuid',
            null,
            null,
            null,
            null,
            guestActor
         )
         const result = await useCase.execute(command)

         expect(result).toBe(expectedBalance)
         expect(repository.findBalance).toHaveBeenCalledWith('guest-account-uuid')
      })

      it('returns 0 balance when the own account has no balance row yet', async () => {
         const ownAccount = personalAccount({ id: 'guest-account-uuid' })
         repository.findAccountById.mockResolvedValue(ownAccount)
         repository.findBalance.mockResolvedValue(null)

         const command = new GetBalanceCommand(
            'guest-account-uuid',
            null,
            null,
            null,
            null,
            guestActor
         )
         const result = await useCase.execute(command)

         expect(result.ledgerAccountId).toBe('guest-account-uuid')
         expect(result.balanceCents).toBe(0n)
      })

      it('rejects reading another user account via ownerAccountId without touching the repository', async () => {
         const command = new GetBalanceCommand(
            null,
            'guest',
            'guest-victim',
            'clearing',
            'VND',
            guestActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
         expect(repository.findAccount).not.toHaveBeenCalled()
         expect(repository.getOrCreateAccount).not.toHaveBeenCalled()
         expect(repository.findBalance).not.toHaveBeenCalled()
      })

      it('rejects reading another user account by ledgerAccountId (no existence leak)', async () => {
         const foreignAccount = personalAccount({
            id: 'victim-account-uuid',
            ownerAccountId: 'guest-victim'
         })
         repository.findAccountById.mockResolvedValue(foreignAccount)

         const command = new GetBalanceCommand(
            'victim-account-uuid',
            null,
            null,
            null,
            null,
            guestActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
         expect(repository.findBalance).not.toHaveBeenCalled()
      })

      it('host cannot read a guest account by ledgerAccountId', async () => {
         const guestAccount = personalAccount({
            id: 'victim-account-uuid',
            ownerAccountId: 'guest-victim'
         })
         repository.findAccountById.mockResolvedValue(guestAccount)

         const command = new GetBalanceCommand(
            'victim-account-uuid',
            null,
            null,
            null,
            null,
            hostActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
         expect(repository.findBalance).not.toHaveBeenCalled()
      })

      it('rejects a nonexistent ledgerAccountId for a personal actor', async () => {
         repository.findAccountById.mockResolvedValue(null)

         const command = new GetBalanceCommand('missing-id', null, null, null, null, guestActor)

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
      })

      it('rejects platform owner selector for a personal actor without querying the repository', async () => {
         const command = new GetBalanceCommand(
            null,
            'platform',
            null,
            'revenue',
            'VND',
            guestActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountForbiddenException
         )
         expect(repository.findAccount).not.toHaveBeenCalled()
         expect(repository.getOrCreateAccount).not.toHaveBeenCalled()
      })

      it('rejects tax_authority owner selector for a personal actor', async () => {
         const command = new GetBalanceCommand(
            null,
            'tax_authority',
            null,
            'tax_payable_vn',
            'VND',
            hostActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountForbiddenException
         )
         expect(repository.findAccount).not.toHaveBeenCalled()
      })

      it('rejects reading a platform account by ledgerAccountId for a personal actor', async () => {
         const platformAccount = LedgerAccount.create({
            id: 'platform-account-uuid',
            ownerType: 'platform',
            ownerAccountId: null,
            accountSubtype: 'revenue',
            currency: 'VND'
         })
         repository.findAccountById.mockResolvedValue(platformAccount)

         const command = new GetBalanceCommand(
            'platform-account-uuid',
            null,
            null,
            null,
            null,
            guestActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
         expect(repository.findBalance).not.toHaveBeenCalled()
      })

      it('rejects a scoped actor without an account identity', async () => {
         const anonymousScopedActor = new GetBalanceActor(null, 'guest')
         const command = new GetBalanceCommand(
            null,
            'guest',
            'guest-1',
            'clearing',
            'VND',
            anonymousScopedActor
         )

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountForbiddenException
         )
         expect(repository.findAccount).not.toHaveBeenCalled()
      })

      it('rejects a personal actor with no selector parameters at all', async () => {
         const command = new GetBalanceCommand(null, null, null, null, null, guestActor)

         await expect(useCase.execute(command)).rejects.toBeInstanceOf(
            LedgerAccountNotFoundException
         )
      })

      it('repeated own-balance lookups stay independent (lookup then already-registered account)', async () => {
         const ownAccount = personalAccount({ id: 'guest-account-uuid' })

         // First call: account does not exist yet and gets registered with a 0 balance.
         repository.findAccount.mockResolvedValueOnce(null)
         repository.getOrCreateAccount.mockResolvedValueOnce(ownAccount)
         const first = await useCase.execute(
            new GetBalanceCommand(null, 'guest', null, 'clearing', 'VND', guestActor)
         )

         // Second call: the account now exists and has a real balance.
         repository.findAccount.mockResolvedValueOnce(ownAccount)
         repository.findBalance.mockResolvedValueOnce(
            new LedgerBalance('guest-account-uuid', 12000n, new Date())
         )
         const second = await useCase.execute(
            new GetBalanceCommand(null, 'guest', null, 'clearing', 'VND', guestActor)
         )

         expect(first.ledgerAccountId).toBe('guest-account-uuid')
         expect(first.balanceCents).toBe(0n)
         expect(second.balanceCents).toBe(12000n)
         expect(repository.getOrCreateAccount).toHaveBeenCalledTimes(1)
         expect(repository.findBalance).toHaveBeenCalledTimes(1)
      })
   })
})
