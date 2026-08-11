import { Injectable } from '@nestjs/common'
import { KycDocStatus, KycDocument } from '../../domain/entities/kyc-document.entity'
import {
   InvalidKycReviewActionException,
   KycDocumentNotFoundException
} from '../../domain/errors/kyc.errors'
import { KycRepository } from '../../domain/repositories/kyc.repository'

export class ReviewKycCommand {
   constructor(
      public readonly documentId: string,
      public readonly adminId: string,
      public readonly action: 'approve' | 'reject',
      public readonly rejectionReason: string | null
   ) {}
}

export class ReviewKycResult {
   constructor(
      public readonly documentId: string,
      public readonly status: KycDocStatus
   ) {}
}

@Injectable()
export class ReviewKycUseCase {
   constructor(private readonly kycRepository: KycRepository) {}

   async execute(command: ReviewKycCommand): Promise<ReviewKycResult> {
      // 1. Find document
      const document = await this.kycRepository.findDocumentById(command.documentId)
      if (!document) {
         throw new KycDocumentNotFoundException(command.documentId)
      }

      // 2. Validate action
      if (command.action !== 'approve' && command.action !== 'reject') {
         throw new InvalidKycReviewActionException(command.action)
      }

      // 3. Update status
      const finalDocStatus: KycDocStatus = command.action === 'approve' ? 'verified' : 'rejected'
      const profileKycStatus = command.action === 'approve' ? 'verified' : 'rejected'

      const updatedDoc = new KycDocument(
         document.id,
         document.accountId,
         document.docType,
         document.countryCode,
         document.documentNumberEnc,
         document.fileUrlFront,
         document.fileUrlBack,
         document.issueDate,
         document.expiryDate,
         finalDocStatus,
         command.action === 'reject'
            ? command.rejectionReason || 'Manually rejected by admin'
            : null,
         command.adminId,
         new Date(),
         document.createdAt
      )

      // 4. Persist
      await this.kycRepository.saveDocument(updatedDoc)
      await this.kycRepository.updateProfileKycStatus(document.accountId, profileKycStatus)

      return new ReviewKycResult(updatedDoc.id, updatedDoc.status)
   }
}
