import { KycProviderPort } from '../ports/kyc-provider.port'
import { KycCheck } from '../../domain/entities/kyc-check.entity'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { RescreenKycCommand, RescreenKycUseCase } from './rescreen-kyc.usecase'

describe('RescreenKycUseCase', () => {
   let useCase: RescreenKycUseCase
   let repository: jest.Mocked<KycRepository>
   let provider: jest.Mocked<KycProviderPort>

   const expiringCheck = (id: string, accountId: string) =>
      new KycCheck(
         id,
         accountId,
         'background_check',
         null,
         'previous-provider',
         `previous-${id}`,
         'pass',
         80,
         { previous: true },
         new Date('2026-09-10T00:00:00.000Z'),
         new Date('2026-01-01T00:00:00.000Z')
      )

   beforeEach(() => {
      repository = {
         findExpiringBackgroundChecks: jest.fn(),
         saveCheck: jest.fn(),
         updateProfileKycStatus: jest.fn(),
         findDocumentById: jest.fn(),
         saveDocument: jest.fn(),
         findLastDocumentByAccountId: jest.fn(),
         findDocumentsByStatus: jest.fn()
      }

      provider = {
         verifyIdentity: jest.fn(),
         runBackgroundCheck: jest.fn()
      }

      repository.saveCheck.mockImplementation((check) => Promise.resolve(check))
      repository.updateProfileKycStatus.mockResolvedValue()
      useCase = new RescreenKycUseCase(repository, provider)
   })

   it('returns zero counts without calling the provider when no checks are expiring', async () => {
      repository.findExpiringBackgroundChecks.mockResolvedValue([])

      await expect(useCase.execute(new RescreenKycCommand())).resolves.toEqual({
         totalRescreened: 0,
         passedCount: 0,
         failedCount: 0
      })
      expect(provider.runBackgroundCheck.mock.calls).toHaveLength(0)
      expect(repository.saveCheck.mock.calls).toHaveLength(0)
   })

   it('saves a passed check and verifies the account profile', async () => {
      const check = expiringCheck('check-1', 'account-1')
      repository.findExpiringBackgroundChecks.mockResolvedValue([check])
      provider.runBackgroundCheck.mockResolvedValue({
         result: 'pass',
         score: 98,
         providerReferenceId: 'new-provider-ref',
         rawResponse: { provider: 'test-provider', passed: true }
      })

      const result = await useCase.execute(new RescreenKycCommand())

      expect(result).toEqual({
         totalRescreened: 1,
         passedCount: 1,
         failedCount: 0
      })
      expect(repository.saveCheck.mock.calls).toHaveLength(1)
      expect(repository.saveCheck.mock.calls[0]?.[0]).toEqual(
         expect.objectContaining({
            accountId: 'account-1',
            checkType: 'background_check',
            providerReferenceId: 'new-provider-ref',
            result: 'pass',
            score: 98,
            rawResponse: { provider: 'test-provider', passed: true }
         })
      )
      expect(repository.updateProfileKycStatus.mock.calls).toContainEqual(['account-1', 'verified'])
   })

   it('saves a failed check and rejects the account profile', async () => {
      const check = expiringCheck('check-2', 'account-2')
      repository.findExpiringBackgroundChecks.mockResolvedValue([check])
      provider.runBackgroundCheck.mockResolvedValue({
         result: 'fail',
         score: 12,
         providerReferenceId: 'failed-provider-ref',
         rawResponse: { provider: 'test-provider', passed: false }
      })

      const result = await useCase.execute(new RescreenKycCommand())

      expect(result).toEqual({
         totalRescreened: 1,
         passedCount: 0,
         failedCount: 1
      })
      expect(repository.updateProfileKycStatus.mock.calls).toContainEqual(['account-2', 'rejected'])
   })

   it('continues processing other checks when one provider call fails', async () => {
      const firstCheck = expiringCheck('check-1', 'account-1')
      const secondCheck = expiringCheck('check-2', 'account-2')
      repository.findExpiringBackgroundChecks.mockResolvedValue([firstCheck, secondCheck])
      provider.runBackgroundCheck
         .mockRejectedValueOnce(new Error('provider unavailable'))
         .mockResolvedValueOnce({
            result: 'pass',
            score: 91,
            providerReferenceId: 'second-provider-ref',
            rawResponse: { provider: 'test-provider', passed: true }
         })
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

      const result = await useCase.execute(new RescreenKycCommand())

      expect(result).toEqual({
         totalRescreened: 2,
         passedCount: 1,
         failedCount: 0
      })
      expect(provider.runBackgroundCheck.mock.calls).toHaveLength(2)
      expect(repository.saveCheck.mock.calls).toHaveLength(1)
      expect(repository.updateProfileKycStatus.mock.calls).toContainEqual(['account-2', 'verified'])
      expect(errorSpy.mock.calls).toContainEqual([
         'Failed to rescreen account account-1:',
         expect.any(Error)
      ])
      errorSpy.mockRestore()
   })
})
