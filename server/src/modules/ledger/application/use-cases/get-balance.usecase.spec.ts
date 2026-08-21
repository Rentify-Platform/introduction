import { Test, TestingModule } from '@nestjs/testing'
import { GetBalanceUseCase, GetBalanceCommand } from './get-balance.usecase'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { LedgerAccount } from '../../domain/entities/ledger-account.entity'

describe('GetBalanceUseCase', () => {
   let useCase: GetBalanceUseCase
   let repository: jest.Mocked<LedgerRepository>

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

   it('should retrieve balance by account ID successfully', async () => {
      // 1.   Mock balance exists
      const expectedBalance = new LedgerBalance('account-uuid', 25000n, new Date())
      repository.findBalance.mockResolvedValue(expectedBalance)

      // 2.   Execute command
      const command = new GetBalanceCommand('account-uuid', null, null, null, null)
      const result = await useCase.execute(command)

      // 3.   Verify balance retrieved
      expect(result).toBe(expectedBalance)
      expect(repository.findBalance).toHaveBeenCalledWith('account-uuid')
   })

   it('should retrieve balance by owner details and create account if missing', async () => {
      // 1.   Mock account does not exist initially
      repository.findAccount.mockResolvedValue(null)

      // 2.   Mock getOrCreateAccount registering the account
      const createdAccount = LedgerAccount.create({
         id: 'new-account-uuid',
         ownerType: 'host',
         ownerAccountId: 'host-uuid',
         accountSubtype: 'payable',
         currency: 'VND'
      })
      repository.getOrCreateAccount.mockResolvedValue(createdAccount)

      // 3.   Execute command
      const command = new GetBalanceCommand(null, 'host', 'host-uuid', 'payable', 'VND')
      const result = await useCase.execute(command)

      // 4.   Verify new balance with 0n returned
      expect(result).toBeDefined()
      expect(result.ledgerAccountId).toBe('new-account-uuid')
      expect(result.balanceCents).toBe(0n)
      expect(repository.getOrCreateAccount).toHaveBeenCalledWith(
         'host',
         'host-uuid',
         'payable',
         'VND'
      )
   })
})
