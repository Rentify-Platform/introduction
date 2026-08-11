export class BalanceResponse {
   constructor(
      public readonly ledgerAccountId: string,
      public readonly balanceCents: string,
      public readonly updatedAt: string
   ) {}
}
