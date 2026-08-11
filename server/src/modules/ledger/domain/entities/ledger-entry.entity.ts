export class LedgerEntry {
   constructor(
      public readonly id: bigint | null,
      public readonly transactionId: string,
      public readonly ledgerAccountId: string,
      public readonly amountCents: bigint,
      public readonly currency: string,
      public readonly createdAt: Date | null = null
   ) {}

   static create(params: {
      transactionId: string
      ledgerAccountId: string
      amountCents: bigint
      currency: string
   }): LedgerEntry {
      return new LedgerEntry(
         null,
         params.transactionId,
         params.ledgerAccountId,
         params.amountCents,
         params.currency.toUpperCase(),
         new Date()
      )
   }
}
