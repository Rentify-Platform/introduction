import { SubmitKycResult } from '../../application/use-cases/submit-guest-kyc.usecase'
import { ReviewKycResult } from '../../application/use-cases/review-kyc.usecase'
import { RescreenKycResult } from '../../application/use-cases/rescreen-kyc.usecase'
import {
   SubmitKycResponse,
   ReviewKycResponse,
   RescreenKycResponse
} from '../responses/kyc.response'

export class KycMapper {
   static toSubmitResponse(result: SubmitKycResult): SubmitKycResponse {
      return new SubmitKycResponse(result.documentId, result.status, result.verificationResult)
   }

   static toReviewResponse(result: ReviewKycResult): ReviewKycResponse {
      return new ReviewKycResponse(result.documentId, result.status)
   }

   static toRescreenResponse(result: RescreenKycResult): RescreenKycResponse {
      return new RescreenKycResponse(result.totalRescreened, result.passedCount, result.failedCount)
   }

   static toDocumentResponse(doc: any) {
      return {
         id: doc.id,
         accountId: doc.accountId,
         docType: doc.docType,
         countryCode: doc.countryCode,
         fileUrlFront: doc.fileUrlFront,
         fileUrlBack: doc.fileUrlBack,
         issueDate: doc.issueDate,
         expiryDate: doc.expiryDate,
         status: doc.status,
         rejectionReason: doc.rejectionReason,
         reviewedBy: doc.reviewedBy,
         reviewedAt: doc.reviewedAt,
         createdAt: doc.createdAt
      }
   }
}
