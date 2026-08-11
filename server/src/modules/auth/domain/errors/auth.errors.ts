import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class EmailAlreadyRegisteredException extends BusinessException {
   constructor(email: string) {
      super(
         'EMAIL_ALREADY_REGISTERED',
         `Email '${email}' is already registered in the system`,
         HttpStatus.CONFLICT
      )
   }
}

export class InvalidCredentialsException extends BusinessException {
   constructor() {
      super('INVALID_CREDENTIALS', 'Invalid email or password', HttpStatus.UNAUTHORIZED)
   }
}

export class AccountStatusException extends BusinessException {
   constructor(status: string) {
      super('ACCOUNT_NOT_ACTIVE', `Your account is currently ${status}`, HttpStatus.UNAUTHORIZED)
   }
}

export class AccountNotFoundException extends BusinessException {
   constructor(id: string) {
      super('ACCOUNT_NOT_FOUND', `Account with ID '${id}' not found`, HttpStatus.NOT_FOUND)
   }
}
