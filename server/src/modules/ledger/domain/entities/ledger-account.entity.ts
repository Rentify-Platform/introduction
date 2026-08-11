import { randomUUID } from 'crypto'

export type LedgerOwnerType = 'platform' | 'host' | 'guest' | 'tax_authority'

export class LedgerAccount {
   constructor(
      public readonly id: string,
      public readonly ownerType: LedgerOwnerType,
      public readonly ownerAccountId: string | null,
      public readonly accountSubtype: string,
      public readonly currency: string,
      public readonly createdAt: Date
   ) {}

   static create(params: {
      id?: string
      ownerType: LedgerOwnerType
      ownerAccountId?: string | null
      accountSubtype: string
      currency: string
   }): LedgerAccount {
      return new LedgerAccount(
         params.id || randomUUID(),
         params.ownerType,
         params.ownerAccountId || null,
         params.accountSubtype.toLowerCase(),
         params.currency.toUpperCase(),
         new Date()
      )
   }
}
