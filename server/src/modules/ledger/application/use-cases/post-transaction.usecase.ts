import { Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerTransaction, LedgerTxnType } from '../../domain/entities/ledger-transaction.entity'
import { LedgerEntry } from '../../domain/entities/ledger-entry.entity'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'
import { UnbalancedLedgerTransactionException } from '../../domain/errors/ledger.errors'

export class PostTransactionEntryCommand {
   constructor(
      public readonly ledgerAccountId: string | null,
      public readonly ownerType: LedgerOwnerType | null,
      public readonly ownerAccountId: string | null,
      public readonly accountSubtype: string | null,
      public readonly amountCents: bigint,
      public readonly currency: string
   ) {}
}

export class PostTransactionCommand {
   constructor(
      public readonly idempotencyKey: string,
      public readonly type: LedgerTxnType,
      public readonly bookingId: string | null,
      public readonly description: string | null,
      public readonly metadata: any | null,
      public readonly createdBy: string | null,
      public readonly entries: PostTransactionEntryCommand[]
   ) {}
}

@Injectable()
export class PostTransactionUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: PostTransactionCommand): Promise<LedgerTransaction> {
      // 1.   Check idempotency key to prevent duplicate transaction posting
      const existingTxn = await this.ledgerRepository.findTransactionByIdempotencyKey(
         command.idempotencyKey
      )
      if (existingTxn) {
         return existingTxn
      }

      // 2.   Validate double-entry balancing (sum of entries per currency must equal 0)
      const sumByCurrency = new Map<string, bigint>()
      for (const entry of command.entries) {
         const currency = entry.currency.toUpperCase()
         const current = sumByCurrency.get(currency) || 0n
         sumByCurrency.set(currency, current + entry.amountCents)
      }

      for (const [currency, total] of sumByCurrency.entries()) {
         if (total !== 0n) {
            throw new UnbalancedLedgerTransactionException(
               `Ledger transaction is unbalanced for currency ${currency}. Sum of entries is ${total.toString()}`
            )
         }
      }

      // 3.   Resolve or create the ledger accounts for all entries
      const entriesToCreate: LedgerEntry[] = []
      const transactionId = LedgerTransaction.create({
         idempotencyKey: command.idempotencyKey,
         type: command.type
      }).id // Create ID beforehand so entries can reference it

      for (const entry of command.entries) {
         let accountId = entry.ledgerAccountId

         if (!accountId) {
            if (!entry.ownerType || !entry.accountSubtype) {
               throw new UnbalancedLedgerTransactionException(
                  `Each entry must specify either a ledgerAccountId or ownerType/accountSubtype combination.`
               )
            }

            const account = await this.ledgerRepository.getOrCreateAccount(
               entry.ownerType,
               entry.ownerAccountId,
               entry.accountSubtype,
               entry.currency
            )
            accountId = account.id
         }

         entriesToCreate.push(
            LedgerEntry.create({
               transactionId,
               ledgerAccountId: accountId,
               amountCents: entry.amountCents,
               currency: entry.currency
            })
         )
      }

      // 4.   Persist transaction and entries atomically using repository
      const transaction = LedgerTransaction.create({
         id: transactionId,
         idempotencyKey: command.idempotencyKey,
         type: command.type,
         bookingId: command.bookingId,
         description: command.description,
         metadata: command.metadata,
         createdBy: command.createdBy,
         entries: entriesToCreate
      })

      return this.ledgerRepository.saveTransaction(transaction)
   }
}
