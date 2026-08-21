import { BalanceWithAccount } from '../../domain/entities/balance-with-account.entity'
import { Payout } from '../../domain/entities/payout.entity'
import {
   PaginatedPayouts,
   PaginatedTransactions
} from '../../domain/repositories/ledger.repository'
import { LedgerMapper } from './ledger.mapper'
import { LedgerTransactionResponse } from '../responses/transaction.response'

export class AdminBalanceResponse {
   constructor(
      public readonly ledgerAccountId: string,
      public readonly ownerType: string,
      public readonly ownerAccountId: string | null,
      public readonly ownerName: string | null,
      public readonly ownerEmail: string | null,
      public readonly accountSubtype: string,
      public readonly currency: string,
      public readonly balanceCents: string,
      public readonly updatedAt: string
   ) {}
}

export class AdminPayoutResponse {
   constructor(
      public readonly id: string,
      public readonly hostId: string,
      public readonly hostName: string | null,
      public readonly hostEmail: string | null,
      public readonly ledgerTransactionId: string,
      public readonly amountCents: string,
      public readonly currency: string,
      public readonly status: string,
      public readonly scheduledFor: string,
      public readonly paidAt: string | null,
      public readonly providerPayoutId: string | null,
      public readonly createdAt: string
   ) {}
}

export class PaginatedTransactionsResponse {
   constructor(
      public readonly data: LedgerTransactionResponse[],
      public readonly total: number,
      public readonly page: number,
      public readonly limit: number
   ) {}
}

export class PaginatedPayoutsResponse {
   constructor(
      public readonly data: AdminPayoutResponse[],
      public readonly total: number,
      public readonly page: number,
      public readonly limit: number
   ) {}
}

export class AdminLedgerMapper {
   static toBalanceWithAccountResponse(balance: BalanceWithAccount): AdminBalanceResponse {
      return new AdminBalanceResponse(
         balance.ledgerAccountId,
         balance.ownerType,
         balance.ownerAccountId,
         balance.ownerName,
         balance.ownerEmail,
         balance.accountSubtype,
         balance.currency,
         balance.balanceCents.toString(),
         balance.updatedAt.toISOString()
      )
   }

   static toPayoutResponse(payout: Payout): AdminPayoutResponse {
      return new AdminPayoutResponse(
         payout.id,
         payout.hostId,
         payout.hostName,
         payout.hostEmail,
         payout.ledgerTransactionId,
         payout.amountCents.toString(),
         payout.currency,
         payout.status,
         payout.scheduledFor.toISOString(),
         payout.paidAt ? payout.paidAt.toISOString() : null,
         payout.providerPayoutId,
         payout.createdAt.toISOString()
      )
   }

   static toPaginatedTransactionsResponse(
      result: PaginatedTransactions
   ): PaginatedTransactionsResponse {
      return new PaginatedTransactionsResponse(
         result.data.map((txn) => LedgerMapper.toTransactionResponse(txn)),
         result.total,
         result.page,
         result.limit
      )
   }

   static toPaginatedPayoutsResponse(result: PaginatedPayouts): PaginatedPayoutsResponse {
      return new PaginatedPayoutsResponse(
         result.data.map((payout) => AdminLedgerMapper.toPayoutResponse(payout)),
         result.total,
         result.page,
         result.limit
      )
   }
}
