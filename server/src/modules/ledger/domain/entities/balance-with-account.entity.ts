import { LedgerOwnerType } from './ledger-account.entity'

export class BalanceWithAccount {
   constructor(
      public readonly ledgerAccountId: string,
      public readonly ownerType: LedgerOwnerType,
      public readonly ownerAccountId: string | null,
      public readonly ownerName: string | null,
      public readonly ownerEmail: string | null,
      public readonly accountSubtype: string,
      public readonly currency: string,
      public readonly balanceCents: bigint,
      public readonly updatedAt: Date
   ) {}
}
