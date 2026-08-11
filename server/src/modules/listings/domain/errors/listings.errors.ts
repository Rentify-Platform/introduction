import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class PropertyNotFoundException extends BusinessException {
   constructor() {
      super('PROPERTY_NOT_FOUND', 'Property not found', HttpStatus.NOT_FOUND)
   }
}

export class InvalidPropertyStatusTransitionException extends BusinessException {
   constructor(message: string) {
      super('INVALID_PROPERTY_STATUS_TRANSITION', message, HttpStatus.BAD_REQUEST)
   }
}

export class HostNotVerifiedException extends BusinessException {
   constructor() {
      super(
         'HOST_NOT_VERIFIED',
         'Host must complete KYC + tax + payout setup before activating a listing',
         HttpStatus.FORBIDDEN
      )
   }
}

export class PropertyLicenseRequiredException extends BusinessException {
   constructor() {
      super(
         'PROPERTY_LICENSE_REQUIRED',
         'A verified local short-term-rental license is required to activate this listing',
         HttpStatus.BAD_REQUEST
      )
   }
}

export class PropertyTypeNotFoundException extends BusinessException {
   constructor() {
      super(
         'PROPERTY_TYPE_NOT_FOUND',
         'The specified property type is invalid or does not exist',
         HttpStatus.BAD_REQUEST
      )
   }
}

export class UnauthorizedPropertyAccessException extends BusinessException {
   constructor() {
      super(
         'UNAUTHORIZED_PROPERTY_ACCESS',
         'You do not own this property listing',
         HttpStatus.FORBIDDEN
      )
   }
}
