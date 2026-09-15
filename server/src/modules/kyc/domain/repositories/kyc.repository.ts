import { KycCheck } from '../entities/kyc-check.entity'
import { KycDocument } from '../entities/kyc-document.entity'

export abstract class KycRepository {
   abstract findDocumentById(id: string): Promise<KycDocument | null>
   abstract saveDocument(document: KycDocument): Promise<KycDocument>
   abstract saveCheck(check: KycCheck): Promise<KycCheck>
   /**
    * Domain rule (Phase 5, Model A — KYC dùng chung cấp account):
    * KYC xác minh danh tính CÁ NHÂN của account, không gắn với vai trò guest/host.
    * Vì vậy một quyết định KYC (pending/verified/rejected/expired) phải phản ánh
    * đồng thời lên `profiles.guest_kyc_status` và `host_profiles.kyc_status`
    * (nếu host profile tồn tại) — hai trạng thái này không được lệch nhau.
    * Hai lần update phải chạy trong MỘT transaction để không bao giờ tồn tại
    * trạng thái nửa vời khi một bước thất bại.
    */
   abstract updateProfileKycStatus(
      accountId: string,
      status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'
   ): Promise<void>
   abstract findExpiringBackgroundChecks(): Promise<KycCheck[]>
   abstract findLastDocumentByAccountId(accountId: string): Promise<KycDocument | null>
   abstract findDocumentsByStatus(status: string): Promise<KycDocument[]>
}
