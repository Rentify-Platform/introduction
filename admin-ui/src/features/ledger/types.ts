export type LedgerOwnerType = 'platform' | 'host' | 'guest' | 'tax_authority'

export type LedgerTxnType =
   | 'booking_payment'
   | 'platform_fee'
   | 'host_accrual'
   | 'refund'
   | 'payout'
   | 'tax_remittance'
   | 'adjustment'

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export interface LedgerEntry {
   id: string | null
   transactionId: string
   ledgerAccountId: string
   amountCents: string
   currency: string
   createdAt: string | null
}

export interface LedgerTransaction {
   id: string
   idempotencyKey: string
   type: LedgerTxnType
   bookingId: string | null
   description: string | null
   metadata: Record<string, unknown> | null
   createdBy: string | null
   createdAt: string
   entries: LedgerEntry[]
}

export interface PaginatedTransactions {
   data: LedgerTransaction[]
   total: number
   page: number
   limit: number
}

export interface LedgerBalance {
   ledgerAccountId: string
   ownerType: LedgerOwnerType
   ownerAccountId: string | null
   ownerName: string | null
   ownerEmail: string | null
   accountSubtype: string
   currency: string
   balanceCents: string
   updatedAt: string
}

export interface Payout {
   id: string
   hostId: string
   hostName: string | null
   hostEmail: string | null
   ledgerTransactionId: string
   amountCents: string
   currency: string
   status: PayoutStatus
   scheduledFor: string
   paidAt: string | null
   providerPayoutId: string | null
   createdAt: string
}

export interface PaginatedPayouts {
   data: Payout[]
   total: number
   page: number
   limit: number
}

export interface PlatformConfig {
   feeRules: Record<string, unknown>
   updatedAt: string
}

export interface TransactionsFilter {
   type?: LedgerTxnType | ''
   bookingId?: string
   dateFrom?: string
   dateTo?: string
   page?: number
   limit?: number
}

export interface PayoutsFilter {
   hostId?: string
   status?: PayoutStatus | ''
   scheduledForFrom?: string
   scheduledForTo?: string
   page?: number
   limit?: number
}

export type LedgerTab = 'transactions' | 'balances' | 'payouts' | 'settings'
