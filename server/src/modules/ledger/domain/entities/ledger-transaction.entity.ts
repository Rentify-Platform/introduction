import { randomUUID } from 'crypto'
import { LedgerEntry } from './ledger-entry.entity'

export type LedgerTxnType =
   | 'booking_payment'
   | 'platform_fee'
   | 'host_accrual'
   | 'refund'
   | 'payout'
   | 'tax_remittance'
   | 'adjustment'

export class LedgerTransaction {
   constructor(
      public readonly id: string,
      public readonly idempotencyKey: string,
      public readonly type: LedgerTxnType,
      public readonly bookingId: string | null,
      public readonly description: string | null,
      public readonly metadata: any | null,
      public readonly createdBy: string | null,
      public readonly createdAt: Date,
      public readonly entries: LedgerEntry[] = []
   ) {}

   static create(params: {
      id?: string
      idempotencyKey: string
      type: LedgerTxnType
      bookingId?: string | null
      description?: string | null
      metadata?: any | null
      createdBy?: string | null
      entries?: LedgerEntry[]
   }): LedgerTransaction {
      return new LedgerTransaction(
         params.id || randomUUID(),
         params.idempotencyKey,
         params.type,
         params.bookingId || null,
         params.description || null,
         params.metadata || null,
         params.createdBy || null,
         new Date(),
         params.entries || []
      )
   }
}
