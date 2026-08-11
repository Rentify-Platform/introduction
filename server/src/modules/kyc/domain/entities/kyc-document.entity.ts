import { randomUUID } from 'crypto'

export type KycDocType =
   | 'passport'
   | 'national_id'
   | 'drivers_license'
   | 'utility_bill'
   | 'tax_document'
   | 'bank_statement'
   | 'business_license'
export type KycDocStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export class KycDocument {
   constructor(
      public readonly id: string,
      public readonly accountId: string,
      public readonly docType: KycDocType,
      public readonly countryCode: string | null,
      public readonly documentNumberEnc: Buffer | null,
      public readonly fileUrlFront: string,
      public readonly fileUrlBack: string | null,
      public readonly issueDate: Date | null,
      public readonly expiryDate: Date | null,
      public readonly status: KycDocStatus,
      public readonly rejectionReason: string | null,
      public readonly reviewedBy: string | null,
      public readonly reviewedAt: Date | null,
      public readonly createdAt: Date
   ) {}

   static create(params: {
      accountId: string
      docType: KycDocType
      countryCode?: string | null
      documentNumber?: string | null
      fileUrlFront: string
      fileUrlBack?: string | null
      issueDate?: Date | null
      expiryDate?: Date | null
   }): KycDocument {
      if (!params.fileUrlFront) {
         throw new Error('Front file URL is required')
      }

      const documentNumberEnc = params.documentNumber
         ? Buffer.from(params.documentNumber, 'utf-8')
         : null

      return new KycDocument(
         randomUUID(),
         params.accountId,
         params.docType,
         params.countryCode || null,
         documentNumberEnc,
         params.fileUrlFront,
         params.fileUrlBack || null,
         params.issueDate || null,
         params.expiryDate || null,
         'pending',
         null,
         null,
         null,
         new Date()
      )
   }
}
