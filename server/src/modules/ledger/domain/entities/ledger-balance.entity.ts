export class LedgerBalance {
   constructor(
      public readonly ledgerAccountId: string,
      public readonly balanceCents: bigint,
      public readonly updatedAt: Date
   ) {}
}
