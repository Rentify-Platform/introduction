import { LedgerAccount, LedgerOwnerType } from '../entities/ledger-account.entity'
import { LedgerBalance } from '../entities/ledger-balance.entity'
import { LedgerTransaction } from '../entities/ledger-transaction.entity'
import { LedgerEntry } from '../entities/ledger-entry.entity'

export abstract class LedgerRepository {
   abstract findAccountById(id: string): Promise<LedgerAccount | null>

   abstract findAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerAccount | null>

   abstract saveAccount(account: LedgerAccount): Promise<LedgerAccount>

   abstract getOrCreateAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerAccount>

   abstract findBalance(ledgerAccountId: string): Promise<LedgerBalance | null>

   abstract findBalanceByAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerBalance | null>

   abstract findTransactionById(id: string): Promise<LedgerTransaction | null>

   abstract findTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null>

   abstract saveTransaction(transaction: LedgerTransaction): Promise<LedgerTransaction>

   abstract findEntriesByAccountId(accountId: string): Promise<LedgerEntry[]>
}
