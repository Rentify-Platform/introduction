import { KycCheck } from '../entities/kyc-check.entity'
import { KycDocument } from '../entities/kyc-document.entity'

export abstract class KycRepository {
   abstract findDocumentById(id: string): Promise<KycDocument | null>
   abstract saveDocument(document: KycDocument): Promise<KycDocument>
   abstract saveCheck(check: KycCheck): Promise<KycCheck>
   abstract updateProfileKycStatus(
      accountId: string,
      status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'
   ): Promise<void>
   abstract findExpiringBackgroundChecks(): Promise<KycCheck[]>
   abstract findLastDocumentByAccountId(accountId: string): Promise<KycDocument | null>
   abstract findDocumentsByStatus(status: string): Promise<KycDocument[]>
}
