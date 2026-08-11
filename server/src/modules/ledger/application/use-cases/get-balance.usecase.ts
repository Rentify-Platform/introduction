import { Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { LedgerAccountNotFoundException } from '../../domain/errors/ledger.errors'

export class GetBalanceCommand {
   constructor(
      public readonly ledgerAccountId: string | null,
      public readonly ownerType: LedgerOwnerType | null,
      public readonly ownerAccountId: string | null,
      public readonly accountSubtype: string | null,
      public readonly currency: string | null
   ) {}
}

@Injectable()
export class GetBalanceUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: GetBalanceCommand): Promise<LedgerBalance> {
      // 1.   Resolve the ledger account ID from parameters
      let accountId = command.ledgerAccountId

      if (!accountId) {
         if (!command.ownerType || !command.accountSubtype || !command.currency) {
            throw new LedgerAccountNotFoundException(
               'Must provide either ledgerAccountId or ownerType/accountSubtype/currency to retrieve balance.'
            )
         }

         const account = await this.ledgerRepository.findAccount(
            command.ownerType,
            command.ownerAccountId,
            command.accountSubtype,
            command.currency
         )

         if (!account) {
            // If the account has not been created yet, it has no transactions and thus a balance of 0
            // We get or create it so it is officially registered
            const newAccount = await this.ledgerRepository.getOrCreateAccount(
               command.ownerType,
               command.ownerAccountId,
               command.accountSubtype,
               command.currency
            )
            return new LedgerBalance(newAccount.id, 0n, new Date())
         }

         accountId = account.id
      }

      // 2.   Retrieve the balance for the resolved ledger account ID
      const balance = await this.ledgerRepository.findBalance(accountId)
      if (!balance) {
         return new LedgerBalance(accountId, 0n, new Date())
      }

      return balance
   }
}
