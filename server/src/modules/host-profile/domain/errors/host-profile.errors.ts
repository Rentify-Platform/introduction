import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class HostProfileNotFoundException extends BusinessException {
   constructor() {
      super('HOST_PROFILE_NOT_FOUND', 'Host profile not found', HttpStatus.NOT_FOUND)
   }
}

export class HostProfileAlreadyExistsException extends BusinessException {
   constructor() {
      super(
         'HOST_PROFILE_ALREADY_EXISTS',
         'Host profile already exists for this account',
         HttpStatus.CONFLICT
      )
   }
}

export class GuestKycNotVerifiedException extends BusinessException {
   constructor() {
      super(
         'GUEST_KYC_NOT_VERIFIED',
         'Please complete your guest identity verification (KYC) first',
         HttpStatus.BAD_REQUEST
      )
   }
}

export class TaxInfoValidationFailedException extends BusinessException {
   constructor(reason: string) {
      super(
         'TAX_INFO_VALIDATION_FAILED',
         `Tax information validation failed: ${reason}`,
         HttpStatus.BAD_REQUEST
      )
   }
}

export class PayoutAccountValidationFailedException extends BusinessException {
   constructor(reason: string) {
      super(
         'PAYOUT_ACCOUNT_VALIDATION_FAILED',
         `Payout account validation failed: ${reason}`,
         HttpStatus.BAD_REQUEST
      )
   }
}
