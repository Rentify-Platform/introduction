import { KycDocument } from '../../domain/entities/kyc-document.entity'
import { KycDocumentNotFoundException } from '../../domain/errors/kyc.errors'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { ReviewKycCommand, ReviewKycUseCase } from './review-kyc.usecase'

describe('ReviewKycUseCase', () => {
   let useCase: ReviewKycUseCase
   let kycRepository: jest.Mocked<KycRepository>

   beforeEach(() => {
      kycRepository = {
         findDocumentById: jest.fn(),
         saveDocument: jest.fn(),
         updateProfileKycStatus: jest.fn()
      } as any

      useCase = new ReviewKycUseCase(kycRepository)
   })

   it('should successfully approve a pending KYC document', async () => {
      const pendingDoc = new KycDocument(
         'doc-123',
         'acc-123',
         'passport',
         'VN',
         null,
         'http://test.com/front.jpg',
         null,
         null,
         null,
         'pending',
         null,
         null,
         null,
         new Date()
      )

      kycRepository.findDocumentById.mockResolvedValue(pendingDoc)

      const command = new ReviewKycCommand('doc-123', 'admin-99', 'approve', null)
      const result = await useCase.execute(command)

      expect(result.status).toBe('verified')
      expect(kycRepository.saveDocument).toHaveBeenCalled()
      expect(kycRepository.updateProfileKycStatus).toHaveBeenCalledWith('acc-123', 'verified')
   })

   it('should throw KycDocumentNotFoundException if document is not found', async () => {
      kycRepository.findDocumentById.mockResolvedValue(null)

      const command = new ReviewKycCommand('doc-123', 'admin-99', 'approve', null)
      await expect(useCase.execute(command)).rejects.toThrow(KycDocumentNotFoundException)
   })
})
