import { randomUUID } from 'crypto'

export type PaymentStatus =
   'pending' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed'

export class Payment {
   constructor(
      public readonly id: string,
      public readonly bookingId: string,
      public readonly paymentMethodId: string | null,
      public readonly ledgerTransactionId: string | null,
      public readonly status: PaymentStatus,
      public readonly amountCents: bigint,
      public readonly currency: string,
      public readonly provider: string,
      public readonly providerIntentId: string | null,
      public readonly failureReason: string | null,
      public readonly createdAt: Date,
      public readonly updatedAt: Date
   ) {}

   static createSepayPayment(params: {
      bookingId: string
      amountCents: bigint
      currency?: string
      providerIntentId: string
      paymentMethodId?: string | null
   }): Payment {
      return new Payment(
         randomUUID(),
         params.bookingId,
         params.paymentMethodId || null,
         null,
         'pending',
         params.amountCents,
         params.currency || 'VND',
         'sepay',
         params.providerIntentId,
         null,
         new Date(),
         new Date()
      )
   }
}
