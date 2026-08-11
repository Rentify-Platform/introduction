import { Injectable } from '@nestjs/common'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../use-cases/post-transaction.usecase'
import { GetBalanceUseCase, GetBalanceCommand } from '../use-cases/get-balance.usecase'
import { LedgerTransaction } from '../../domain/entities/ledger-transaction.entity'

@Injectable()
export class TaxService {
   constructor(
      private readonly getBalanceUseCase: GetBalanceUseCase,
      private readonly postTransactionUseCase: PostTransactionUseCase
   ) {}

   /**
    * Remits collected tax for a given jurisdiction and currency by zeroing out the tax_payable account.
    */
   async remit(
      jurisdiction: string,
      currency: string,
      idempotencyKey: string
   ): Promise<LedgerTransaction | null> {
      // 1.   Fetch current balance of platform/tax_payable account
      const getBalanceCommand = new GetBalanceCommand(
         null,
         'platform',
         null,
         `tax_payable_${jurisdiction.toLowerCase()}`, // E.g., tax_payable_us, tax_payable_vn
         currency
      )

      const balance = await this.getBalanceUseCase.execute(getBalanceCommand)
      const amountCents = balance.balanceCents

      if (amountCents <= 0n) {
         // Nothing to remit
         return null
      }

      // 2.   Construct entries to zero out tax_payable and offset against platform/clearing
      const entries = [
         new PostTransactionEntryCommand(
            null,
            'platform',
            null,
            `tax_payable_${jurisdiction.toLowerCase()}`,
            -amountCents, // Zeroes out the payable
            currency
         ),
         new PostTransactionEntryCommand(
            null,
            'platform',
            null,
            'clearing',
            amountCents, // Balances the transaction
            currency
         )
      ]

      // 3.   Post the tax_remittance transaction
      const postCommand = new PostTransactionCommand(
         idempotencyKey,
         'tax_remittance',
         null,
         `Tax remittance for ${jurisdiction} in ${currency}`,
         { jurisdiction, currency },
         null,
         entries
      )

      return this.postTransactionUseCase.execute(postCommand)
   }
}
