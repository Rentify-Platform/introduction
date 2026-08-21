import { Test, TestingModule } from '@nestjs/testing'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from './post-transaction.usecase'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerTransaction } from '../../domain/entities/ledger-transaction.entity'
import { LedgerAccount } from '../../domain/entities/ledger-account.entity'
import { UnbalancedLedgerTransactionException } from '../../domain/errors/ledger.errors'

describe('PostTransactionUseCase', () => {
   let useCase: PostTransactionUseCase
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
            PostTransactionUseCase,
            {
               provide: LedgerRepository,
               useValue: mockRepository
            }
         ]
      }).compile()

      useCase = module.get<PostTransactionUseCase>(PostTransactionUseCase)
      repository = module.get(LedgerRepository)
   })

   it('should successfully post a balanced transaction and return it', async () => {
      // 1.   Mock no existing transaction with this idempotency key
      repository.findTransactionByIdempotencyKey.mockResolvedValue(null)

      // 2.   Mock account resolution for platform and host
      const mockPlatformAccount = LedgerAccount.create({
         id: 'platform-account-uuid',
         ownerType: 'platform',
         accountSubtype: 'clearing',
         currency: 'VND'
      })
      const mockHostAccount = LedgerAccount.create({
         id: 'host-account-uuid',
         ownerType: 'host',
         ownerAccountId: 'host-user-uuid',
         accountSubtype: 'payable',
         currency: 'VND'
      })

      repository.getOrCreateAccount.mockImplementation(
         async (ownerType, ownerAccountId, accountSubtype, currency) => {
            if (ownerType === 'platform') return mockPlatformAccount
            return mockHostAccount
         }
      )

      // 3.   Mock saving the transaction
      repository.saveTransaction.mockImplementation(async (txn) => txn)

      // 4.   Create a balanced post transaction command (+100 and -100 VND)
      const command = new PostTransactionCommand(
         'idemp-key-1',
         'booking_payment',
         'booking-uuid',
         'Test transaction',
         null,
         'creator-uuid',
         [
            new PostTransactionEntryCommand(null, 'platform', null, 'clearing', -10000n, 'VND'),
            new PostTransactionEntryCommand(
               null,
               'host',
               'host-user-uuid',
               'payable',
               10000n,
               'VND'
            )
         ]
      )

      const result = await useCase.execute(command)

      // 5.   Verify transaction was saved and entries are correct
      expect(result).toBeDefined()
      expect(result.idempotencyKey).toBe('idemp-key-1')
      expect(result.type).toBe('booking_payment')
      expect(result.bookingId).toBe('booking-uuid')
      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].amountCents).toBe(-10000n)
      expect(result.entries[1].amountCents).toBe(10000n)
      expect(repository.saveTransaction).toHaveBeenCalled()
   })

   it('should throw UnbalancedLedgerTransactionException when entries do not balance to zero', async () => {
      // 1.   Mock no existing transaction
      repository.findTransactionByIdempotencyKey.mockResolvedValue(null)

      // 2.   Create an unbalanced command
      const command = new PostTransactionCommand(
         'idemp-key-2',
         'booking_payment',
         null,
         'Unbalanced',
         null,
         null,
         [
            new PostTransactionEntryCommand(null, 'platform', null, 'clearing', -10000n, 'VND'),
            new PostTransactionEntryCommand(null, 'host', 'host-user-uuid', 'payable', 5000n, 'VND')
         ]
      )

      await expect(useCase.execute(command)).rejects.toThrow(UnbalancedLedgerTransactionException)
      expect(repository.saveTransaction).not.toHaveBeenCalled()
   })

   it('should return existing transaction on idempotency key match without posting again', async () => {
      // 1.   Mock existing transaction
      const existingTxn = LedgerTransaction.create({
         idempotencyKey: 'existing-key',
         type: 'booking_payment',
         description: 'Already posted'
      })
      repository.findTransactionByIdempotencyKey.mockResolvedValue(existingTxn)

      // 2.   Execute command with same key
      const command = new PostTransactionCommand(
         'existing-key',
         'booking_payment',
         null,
         'Duplicate post attempt',
         null,
         null,
         []
      )

      const result = await useCase.execute(command)

      // 3.   Verify it returned the existing transaction without saving
      expect(result).toBe(existingTxn)
      expect(repository.saveTransaction).not.toHaveBeenCalled()
   })
})
