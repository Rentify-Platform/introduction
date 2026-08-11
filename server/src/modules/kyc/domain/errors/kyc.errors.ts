import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class KycDocumentNotFoundException extends BusinessException {
   constructor(documentId: string) {
      super(
         'KYC_DOCUMENT_NOT_FOUND',
         `KYC Document with ID '${documentId}' not found`,
         HttpStatus.NOT_FOUND
      )
   }
}

export class KycAlreadyVerifiedException extends BusinessException {
   constructor() {
      super('KYC_ALREADY_VERIFIED', 'This account is already KYC verified', HttpStatus.BAD_REQUEST)
   }
}

export class InvalidKycReviewActionException extends BusinessException {
   constructor(action: string) {
      super(
         'INVALID_KYC_REVIEW_ACTION',
         `Invalid KYC review action '${action}'. Must be either 'approve' or 'reject'`,
         HttpStatus.BAD_REQUEST
      )
   }
}
