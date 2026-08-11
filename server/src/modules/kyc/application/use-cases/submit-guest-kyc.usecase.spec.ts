import { KycDocument } from '../../domain/entities/kyc-document.entity'
import { KycAlreadyVerifiedException } from '../../domain/errors/kyc.errors'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { KycProviderPort } from '../ports/kyc-provider.port'
import { SubmitGuestKycUseCase, SubmitKycCommand } from './submit-guest-kyc.usecase'

describe('SubmitGuestKycUseCase', () => {
   let useCase: SubmitGuestKycUseCase
   let kycRepository: jest.Mocked<KycRepository>
   let kycProvider: jest.Mocked<KycProviderPort>

   beforeEach(() => {
      kycRepository = {
         findLastDocumentByAccountId: jest.fn(),
         saveDocument: jest.fn(),
         saveCheck: jest.fn(),
         updateProfileKycStatus: jest.fn()
      } as any

      kycProvider = {
         verifyIdentity: jest.fn(),
         runBackgroundCheck: jest.fn()
      }

      useCase = new SubmitGuestKycUseCase(kycRepository, kycProvider)
   })

   it('should successfully submit and verify KYC document if provider passes', async () => {
      kycRepository.findLastDocumentByAccountId.mockResolvedValue(null)
      kycProvider.verifyIdentity.mockResolvedValue({
         result: 'pass',
         score: 95,
         providerReferenceId: 'ref-123',
         rawResponse: {}
      })

      const command = new SubmitKycCommand(
         'acc-123',
         'passport',
         'VN',
         '123456789',
         'http://test.com/front.jpg',
         null,
         null,
         null
      )

      const result = await useCase.execute(command)

      expect(result.status).toBe('verified')
      expect(result.verificationResult).toBe('pass')
      expect(kycRepository.saveDocument).toHaveBeenCalled()
      expect(kycRepository.updateProfileKycStatus).toHaveBeenCalledWith('acc-123', 'verified')
   })

   it('should throw KycAlreadyVerifiedException if user is already verified', async () => {
      const verifiedDoc = new KycDocument(
         'doc-123',
         'acc-123',
         'passport',
         'VN',
         null,
         'http://test.com/front.jpg',
         null,
         null,
         null,
         'verified',
         null,
         null,
         null,
         new Date()
      )

      kycRepository.findLastDocumentByAccountId.mockResolvedValue(verifiedDoc)

      const command = new SubmitKycCommand(
         'acc-123',
         'passport',
         'VN',
         '123456789',
         'http://test.com/front.jpg',
         null,
         null,
         null
      )

      await expect(useCase.execute(command)).rejects.toThrow(KycAlreadyVerifiedException)
   })
})
