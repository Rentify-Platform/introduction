import { LedgerAccount, LedgerOwnerType } from '../entities/ledger-account.entity'
import { LedgerBalance } from '../entities/ledger-balance.entity'
import { LedgerTransaction } from '../entities/ledger-transaction.entity'
import { LedgerEntry } from '../entities/ledger-entry.entity'
import { BalanceWithAccount } from '../entities/balance-with-account.entity'
import { Payout } from '../entities/payout.entity'
import { PlatformConfig } from '../entities/platform-config.entity'

export interface FindAllTransactionsFilter {
   type?: string
   bookingId?: string
   dateFrom?: Date
   dateTo?: Date
   page: number
   limit: number
}

export interface PaginatedTransactions {
   data: LedgerTransaction[]
   total: number
   page: number
   limit: number
}

export interface FindAllPayoutsFilter {
   hostId?: string
   status?: string
   dateFrom?: Date
   dateTo?: Date
   page: number
   limit: number
}

export interface PaginatedPayouts {
   data: Payout[]
   total: number
   page: number
   limit: number
}

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

   abstract findAllTransactions(filter: FindAllTransactionsFilter): Promise<PaginatedTransactions>

   abstract findAllBalances(): Promise<BalanceWithAccount[]>

   abstract findAllPayouts(filter: FindAllPayoutsFilter): Promise<PaginatedPayouts>

   abstract findPlatformConfig(): Promise<PlatformConfig | null>

   abstract savePlatformConfig(feeRules: Record<string, unknown>): Promise<PlatformConfig>
}
