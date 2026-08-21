import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { LedgerAccount, LedgerOwnerType } from '../../domain/entities/ledger-account.entity'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import { LedgerTransaction, LedgerTxnType } from '../../domain/entities/ledger-transaction.entity'
import { LedgerEntry } from '../../domain/entities/ledger-entry.entity'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { ledger_owner_type, ledger_txn_type } from '@prisma/client'

@Injectable()
export class LedgerPrismaRepository implements LedgerRepository {
   constructor(private readonly prisma: PrismaService) {}

   private mapToAccountEntity(record: any): LedgerAccount {
      return new LedgerAccount(
         record.id,
         record.owner_type as LedgerOwnerType,
         record.owner_account_id,
         record.account_subtype,
         record.currency,
         record.created_at
      )
   }

   async findAccountById(id: string): Promise<LedgerAccount | null> {
      const record = await this.prisma.ledger_accounts.findUnique({
         where: { id }
      })
      if (!record) return null
      return this.mapToAccountEntity(record)
   }

   async findAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerAccount | null> {
      const normalizedSubtype = accountSubtype.toLowerCase()
      const normalizedCurrency = currency.toUpperCase()

      const record = await this.prisma.ledger_accounts.findFirst({
         where: {
            owner_type: ownerType,
            owner_account_id: ownerAccountId,
            account_subtype: normalizedSubtype,
            currency: normalizedCurrency
         }
      })

      if (!record) return null
      return this.mapToAccountEntity(record)
   }

   async saveAccount(account: LedgerAccount): Promise<LedgerAccount> {
      const record = await this.prisma.ledger_accounts.upsert({
         where: { id: account.id },
         update: {
            owner_type: account.ownerType,
            owner_account_id: account.ownerAccountId,
            account_subtype: account.accountSubtype,
            currency: account.currency
         },
         create: {
            id: account.id,
            owner_type: account.ownerType,
            owner_account_id: account.ownerAccountId,
            account_subtype: account.accountSubtype,
            currency: account.currency,
            created_at: account.createdAt
         }
      })
      return this.mapToAccountEntity(record)
   }

   async getOrCreateAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerAccount> {
      const existing = await this.findAccount(ownerType, ownerAccountId, accountSubtype, currency)
      if (existing) {
         return existing
      }

      const newAccount = LedgerAccount.create({
         ownerType,
         ownerAccountId,
         accountSubtype,
         currency
      })

      try {
         return await this.saveAccount(newAccount)
      } catch (err: any) {
         // Handle unique key violation (P2002) for parallel requests
         if (err.code === 'P2002') {
            const found = await this.findAccount(
               ownerType,
               ownerAccountId,
               accountSubtype,
               currency
            )
            if (found) {
               return found
            }
         }
         throw err
      }
   }

   async findBalance(ledgerAccountId: string): Promise<LedgerBalance | null> {
      const record = await this.prisma.ledger_balances.findUnique({
         where: { ledger_account_id: ledgerAccountId }
      })
      if (!record) return null
      return new LedgerBalance(record.ledger_account_id, record.balance_cents, record.updated_at)
   }

   async findBalanceByAccount(
      ownerType: LedgerOwnerType,
      ownerAccountId: string | null,
      accountSubtype: string,
      currency: string
   ): Promise<LedgerBalance | null> {
      const account = await this.findAccount(ownerType, ownerAccountId, accountSubtype, currency)
      if (!account) return null
      return this.findBalance(account.id)
   }

   async findTransactionById(id: string): Promise<LedgerTransaction | null> {
      const record = await this.prisma.ledger_transactions.findUnique({
         where: { id },
         include: { ledger_entries: true }
      })
      if (!record) return null

      const entries = record.ledger_entries.map(
         (e) =>
            new LedgerEntry(
               e.id,
               e.transaction_id,
               e.ledger_account_id,
               e.amount_cents,
               e.currency,
               e.created_at
            )
      )

      return new LedgerTransaction(
         record.id,
         record.idempotency_key,
         record.type,
         record.booking_id,
         record.description,
         record.metadata,
         record.created_by,
         record.created_at,
         entries
      )
   }

   async findTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null> {
      const record = await this.prisma.ledger_transactions.findUnique({
         where: { idempotency_key: key },
         include: { ledger_entries: true }
      })
      if (!record) return null

      const entries = record.ledger_entries.map(
         (e) =>
            new LedgerEntry(
               e.id,
               e.transaction_id,
               e.ledger_account_id,
               e.amount_cents,
               e.currency,
               e.created_at
            )
      )

      return new LedgerTransaction(
         record.id,
         record.idempotency_key,
         record.type,
         record.booking_id,
         record.description,
         record.metadata,
         record.created_by,
         record.created_at,
         entries
      )
   }

   async saveTransaction(transaction: LedgerTransaction): Promise<LedgerTransaction> {
      return this.prisma.$transaction(async (tx) => {
         // Create the transaction
         await tx.ledger_transactions.create({
            data: {
               id: transaction.id,
               idempotency_key: transaction.idempotencyKey,
               type: transaction.type,
               booking_id: transaction.bookingId,
               description: transaction.description,
               metadata: transaction.metadata || undefined,
               created_by: transaction.createdBy,
               created_at: transaction.createdAt
            }
         })

         // Create the entries
         for (const entry of transaction.entries) {
            await tx.ledger_entries.create({
               data: {
                  transaction_id: transaction.id,
                  ledger_account_id: entry.ledgerAccountId,
                  amount_cents: entry.amountCents,
                  currency: entry.currency
               }
            })
         }

         return transaction
      })
   }

   async findEntriesByAccountId(accountId: string): Promise<LedgerEntry[]> {
      const records = await this.prisma.ledger_entries.findMany({
         where: { ledger_account_id: accountId },
         orderBy: { created_at: 'asc' }
      })

      return records.map(
         (e) =>
            new LedgerEntry(
               e.id,
               e.transaction_id,
               e.ledger_account_id,
               e.amount_cents,
               e.currency,
               e.created_at
            )
      )
   }
}
