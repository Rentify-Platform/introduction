import { randomUUID } from 'crypto'

export type KycCheckType =
   | 'identity_document'
   | 'facial_match'
   | 'background_check'
   | 'address_verification'
   | 'business_license'
   | 'tax_info'
   | 'bank_account_match'
export type KycCheckResult = 'pass' | 'fail' | 'review_required'
export type KycJsonValue = string | number | boolean | KycJsonObject | KycJsonValue[] | null
export type KycJsonObject = { [key: string]: KycJsonValue | undefined }

export class KycCheck {
   constructor(
      public readonly id: string,
      public readonly accountId: string,
      public readonly checkType: KycCheckType,
      public readonly relatedDocumentId: string | null,
      public readonly provider: string,
      public readonly providerReferenceId: string | null,
      public readonly result: KycCheckResult,
      public readonly score: number | null,
      public readonly rawResponse: KycJsonValue,
      public readonly expiresAt: Date | null,
      public readonly createdAt: Date
   ) {}

   static create(params: {
      accountId: string
      checkType: KycCheckType
      relatedDocumentId?: string | null
      provider: string
      providerReferenceId?: string | null
      result: KycCheckResult
      score?: number | null
      rawResponse?: KycJsonValue
      expiresAt?: Date | null
   }): KycCheck {
      return new KycCheck(
         randomUUID(),
         params.accountId,
         params.checkType,
         params.relatedDocumentId || null,
         params.provider,
         params.providerReferenceId || null,
         params.result,
         params.score !== undefined && params.score !== null ? params.score : null,
         params.rawResponse || null,
         params.expiresAt || null,
         new Date()
      )
   }
}
