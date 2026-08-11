import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { LedgerTransaction } from '../../domain/entities/ledger-transaction.entity'
import { LedgerEntry } from '../../domain/entities/ledger-entry.entity'
import { BalanceResponse } from '../responses/balance.response'
import { LedgerTransactionResponse, LedgerEntryResponse } from '../responses/transaction.response'

export class LedgerMapper {
   static toBalanceResponse(balance: LedgerBalance): BalanceResponse {
      return new BalanceResponse(
         balance.ledgerAccountId,
         balance.balanceCents.toString(),
         balance.updatedAt.toISOString()
      )
   }

   static toEntryResponse(entry: LedgerEntry): LedgerEntryResponse {
      return new LedgerEntryResponse(
         entry.id ? entry.id.toString() : null,
         entry.transactionId,
         entry.ledgerAccountId,
         entry.amountCents.toString(),
         entry.currency,
         entry.createdAt ? entry.createdAt.toISOString() : null
      )
   }

   static toTransactionResponse(transaction: LedgerTransaction): LedgerTransactionResponse {
      const entries = (transaction.entries || []).map((e) => this.toEntryResponse(e))
      return new LedgerTransactionResponse(
         transaction.id,
         transaction.idempotencyKey,
         transaction.type,
         transaction.bookingId,
         transaction.description,
         transaction.metadata,
         transaction.createdBy,
         transaction.createdAt.toISOString(),
         entries
      )
   }
}
