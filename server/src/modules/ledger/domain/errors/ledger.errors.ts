import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class LedgerAccountNotFoundException extends BusinessException {
   constructor(message: string) {
      super('LEDGER_ACCOUNT_NOT_FOUND', message, HttpStatus.NOT_FOUND)
   }
}

export class UnbalancedLedgerTransactionException extends BusinessException {
   constructor(message: string) {
      super('UNBALANCED_LEDGER_TRANSACTION', message, HttpStatus.BAD_REQUEST)
   }
}

export class LedgerIdempotencyConflictException extends BusinessException {
   constructor(message: string) {
      super('LEDGER_IDEMPOTENCY_CONFLICT', message, HttpStatus.CONFLICT)
   }
}

export class LedgerBalanceInsufficientException extends BusinessException {
   constructor(message: string) {
      super('LEDGER_BALANCE_INSUFFICIENT', message, HttpStatus.BAD_REQUEST)
   }
}
