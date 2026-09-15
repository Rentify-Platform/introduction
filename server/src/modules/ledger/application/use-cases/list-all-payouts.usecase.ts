import { Injectable } from '@nestjs/common'
import {
   FindAllPayoutsFilter,
   LedgerRepository,
   PaginatedPayouts
} from '../../domain/repositories/ledger.repository'

export class ListAllPayoutsCommand {
   constructor(
      public readonly hostId?: string,
      public readonly status?: string,
      public readonly dateFrom?: Date,
      public readonly dateTo?: Date,
      public readonly page?: number,
      public readonly limit?: number
   ) {}
}

@Injectable()
export class ListAllPayoutsUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: ListAllPayoutsCommand): Promise<PaginatedPayouts> {
      // 1. Build filter from command
      const filter: FindAllPayoutsFilter = {
         hostId: command.hostId,
         status: command.status,
         dateFrom: command.dateFrom,
         dateTo: command.dateTo,
         page: command.page ?? 1,
         limit: command.limit ?? 20
      }

      // 2. Delegate to repository
      return this.ledgerRepository.findAllPayouts(filter)
   }
}
