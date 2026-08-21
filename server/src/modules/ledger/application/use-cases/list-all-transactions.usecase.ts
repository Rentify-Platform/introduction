import { Injectable } from '@nestjs/common'
import {
   FindAllTransactionsFilter,
   LedgerRepository,
   PaginatedTransactions
} from '../../domain/repositories/ledger.repository'

export class ListAllTransactionsCommand {
   constructor(
      public readonly type?: string,
      public readonly bookingId?: string,
      public readonly dateFrom?: Date,
      public readonly dateTo?: Date,
      public readonly page?: number,
      public readonly limit?: number
   ) {}
}

@Injectable()
export class ListAllTransactionsUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: ListAllTransactionsCommand): Promise<PaginatedTransactions> {
      // 1. Build filter from command
      const filter: FindAllTransactionsFilter = {
         type: command.type,
         bookingId: command.bookingId,
         dateFrom: command.dateFrom,
         dateTo: command.dateTo,
         page: command.page ?? 1,
         limit: command.limit ?? 20
      }

      // 2. Delegate to repository
      return this.ledgerRepository.findAllTransactions(filter)
   }
}
