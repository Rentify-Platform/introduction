export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export class Payout {
   constructor(
      public readonly id: string,
      public readonly hostId: string,
      public readonly hostName: string | null,
      public readonly hostEmail: string | null,
      public readonly ledgerTransactionId: string,
      public readonly amountCents: bigint,
      public readonly currency: string,
      public readonly status: PayoutStatus,
      public readonly scheduledFor: Date,
      public readonly paidAt: Date | null,
      public readonly providerPayoutId: string | null,
      public readonly createdAt: Date
   ) {}
}
