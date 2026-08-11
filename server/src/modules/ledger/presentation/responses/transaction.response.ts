export class LedgerEntryResponse {
   constructor(
      public readonly id: string | null,
      public readonly transactionId: string,
      public readonly ledgerAccountId: string,
      public readonly amountCents: string,
      public readonly currency: string,
      public readonly createdAt: string | null
   ) {}
}

export class LedgerTransactionResponse {
   constructor(
      public readonly id: string,
      public readonly idempotencyKey: string,
      public readonly type: string,
      public readonly bookingId: string | null,
      public readonly description: string | null,
      public readonly metadata: any | null,
      public readonly createdBy: string | null,
      public readonly createdAt: string,
      public readonly entries: LedgerEntryResponse[]
   ) {}
}
