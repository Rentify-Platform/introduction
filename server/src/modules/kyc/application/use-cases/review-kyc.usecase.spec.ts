import { KycDocument } from '../../domain/entities/kyc-document.entity'
import {
   KycDocumentAlreadyReviewedException,
   KycDocumentNotFoundException,
   KycRejectionReasonRequiredException
} from '../../domain/errors/kyc.errors'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { ReviewKycCommand, ReviewKycUseCase } from './review-kyc.usecase'

describe('ReviewKycUseCase', () => {
   const findDocumentById = jest.fn()
   const saveDocument = jest.fn()
   const updateProfileKycStatus = jest.fn()
   let useCase: ReviewKycUseCase

   const document = (status: 'pending' | 'verified' | 'rejected') =>
      new KycDocument(
         'doc-123',
         'acc-123',
         'passport',
         'VN',
         null,
         'http://test.com/front.jpg',
         null,
         null,
         null,
         status,
         null,
         null,
         null,
         new Date('2026-08-20T00:00:00.000Z')
      )

   beforeEach(() => {
      jest.clearAllMocks()
      const kycRepository = {
         findDocumentById,
         saveDocument,
         updateProfileKycStatus
      } as unknown as KycRepository

      useCase = new ReviewKycUseCase(kycRepository)
   })

   it('should successfully approve a pending KYC document', async () => {
      findDocumentById.mockResolvedValue(document('pending'))
      saveDocument.mockImplementation((updatedDocument) => Promise.resolve(updatedDocument))

      const command = new ReviewKycCommand('doc-123', 'admin-99', 'approve', null)
      const result = await useCase.execute(command)

      expect(result.status).toBe('verified')
      expect(saveDocument).toHaveBeenCalledWith(
         expect.objectContaining({
            status: 'verified',
            rejectionReason: null,
            reviewedBy: 'admin-99'
         })
      )
      expect(updateProfileKycStatus).toHaveBeenCalledWith('acc-123', 'verified')
   })

   it('rejects a pending document with the trimmed reason and reviewer', async () => {
      findDocumentById.mockResolvedValue(document('pending'))
      saveDocument.mockImplementation((updatedDocument) => Promise.resolve(updatedDocument))

      const result = await useCase.execute(
         new ReviewKycCommand('doc-123', 'admin-99', 'reject', '  Image is blurry  ')
      )

      expect(result.status).toBe('rejected')
      expect(saveDocument).toHaveBeenCalledWith(
         expect.objectContaining({
            status: 'rejected',
            rejectionReason: 'Image is blurry',
            reviewedBy: 'admin-99'
         })
      )
      expect(updateProfileKycStatus).toHaveBeenCalledWith('acc-123', 'rejected')
   })

   it.each([null, '', '   '])('requires a non-blank rejection reason: %p', async (reason) => {
      findDocumentById.mockResolvedValue(document('pending'))

      await expect(
         useCase.execute(new ReviewKycCommand('doc-123', 'admin-99', 'reject', reason))
      ).rejects.toBeInstanceOf(KycRejectionReasonRequiredException)
      expect(saveDocument).not.toHaveBeenCalled()
      expect(updateProfileKycStatus).not.toHaveBeenCalled()
   })

   it.each(['verified', 'rejected'] as const)(
      'rejects an already %s document without writes',
      async (status) => {
         findDocumentById.mockResolvedValue(document(status))

         await expect(
            useCase.execute(new ReviewKycCommand('doc-123', 'admin-99', 'approve', null))
         ).rejects.toBeInstanceOf(KycDocumentAlreadyReviewedException)
         expect(saveDocument).not.toHaveBeenCalled()
         expect(updateProfileKycStatus).not.toHaveBeenCalled()
      }
   )

   it('ignores a supplied rejection reason when approving', async () => {
      findDocumentById.mockResolvedValue(document('pending'))
      saveDocument.mockImplementation((updatedDocument) => Promise.resolve(updatedDocument))

      await useCase.execute(
         new ReviewKycCommand('doc-123', 'admin-99', 'approve', 'not applicable')
      )

      expect(saveDocument).toHaveBeenCalledWith(expect.objectContaining({ rejectionReason: null }))
   })

   it('should throw KycDocumentNotFoundException if document is not found', async () => {
      findDocumentById.mockResolvedValue(null)

      const command = new ReviewKycCommand('doc-123', 'admin-99', 'approve', null)
      await expect(useCase.execute(command)).rejects.toThrow(KycDocumentNotFoundException)
      expect(saveDocument).not.toHaveBeenCalled()
      expect(updateProfileKycStatus).not.toHaveBeenCalled()
   })
})
