import { Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { BalanceWithAccount } from '../../domain/entities/balance-with-account.entity'

export class ListAllBalancesCommand {
   constructor() {}
}

@Injectable()
export class ListAllBalancesUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(): Promise<BalanceWithAccount[]> {
      // 1. Retrieve every ledger account balance with account metadata
      return this.ledgerRepository.findAllBalances()
   }
}
