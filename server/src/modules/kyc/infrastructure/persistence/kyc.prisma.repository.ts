import { Injectable } from '@nestjs/common'
import {
   kyc_check_result,
   kyc_check_type,
   kyc_doc_status,
   kyc_doc_type,
   kyc_status
} from '@prisma/client'
import { PrismaService } from '../../../../prisma/prisma.service'
import { KycCheck, KycCheckResult, KycCheckType } from '../../domain/entities/kyc-check.entity'
import { KycDocStatus, KycDocType, KycDocument } from '../../domain/entities/kyc-document.entity'
import { KycRepository } from '../../domain/repositories/kyc.repository'

@Injectable()
export class KycPrismaRepository implements KycRepository {
   constructor(private readonly prisma: PrismaService) {}

   async findDocumentById(id: string): Promise<KycDocument | null> {
      const record = await this.prisma.kyc_documents.findUnique({
         where: { id }
      })

      if (!record) return null

      return new KycDocument(
         record.id,
         record.account_id,
         record.doc_type,
         record.country_code,
         record.document_number_enc ? Buffer.from(record.document_number_enc) : null,
         record.file_url_front,
         record.file_url_back,
         record.issue_date,
         record.expiry_date,
         record.status,
         record.rejection_reason,
         record.reviewed_by,
         record.reviewed_at,
         record.created_at
      )
   }

   async saveDocument(document: KycDocument): Promise<KycDocument> {
      await this.prisma.kyc_documents.upsert({
         where: { id: document.id },
         update: {
            doc_type: document.docType,
            country_code: document.countryCode,
            document_number_enc: document.documentNumberEnc as any,
            file_url_front: document.fileUrlFront,
            file_url_back: document.fileUrlBack,
            issue_date: document.issueDate,
            expiry_date: document.expiryDate,
            status: document.status,
            rejection_reason: document.rejectionReason,
            reviewed_by: document.reviewedBy,
            reviewed_at: document.reviewedAt
         },
         create: {
            id: document.id,
            account_id: document.accountId,
            doc_type: document.docType,
            country_code: document.countryCode,
            document_number_enc: document.documentNumberEnc as any,
            file_url_front: document.fileUrlFront,
            file_url_back: document.fileUrlBack,
            issue_date: document.issueDate,
            expiry_date: document.expiryDate,
            status: document.status,
            rejection_reason: document.rejectionReason,
            reviewed_by: document.reviewedBy,
            reviewed_at: document.reviewedAt,
            created_at: document.createdAt
         }
      })

      return document
   }

   async saveCheck(check: KycCheck): Promise<KycCheck> {
      await this.prisma.kyc_checks.upsert({
         where: { id: check.id },
         update: {
            result: check.result,
            score: check.score,
            raw_response: check.rawResponse,
            expires_at: check.expiresAt
         },
         create: {
            id: check.id,
            account_id: check.accountId,
            check_type: check.checkType,
            related_document_id: check.relatedDocumentId,
            provider: check.provider,
            provider_reference_id: check.providerReferenceId,
            result: check.result,
            score: check.score,
            raw_response: check.rawResponse,
            expires_at: check.expiresAt,
            created_at: check.createdAt
         }
      })

      return check
   }

   async updateProfileKycStatus(
      accountId: string,
      status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'
   ): Promise<void> {
      // 1. Update guest profile
      await this.prisma.profiles.update({
         where: { account_id: accountId },
         data: { guest_kyc_status: status }
      })

      // 2. Update host profile if it exists
      const hostProfile = await this.prisma.host_profiles.findUnique({
         where: { account_id: accountId }
      })
      if (hostProfile) {
         await this.prisma.host_profiles.update({
            where: { account_id: accountId },
            data: { kyc_status: status }
         })
      }
   }

   async findExpiringBackgroundChecks(): Promise<KycCheck[]> {
      const records = await this.prisma.kyc_checks.findMany({
         where: {
            check_type: 'background_check',
            expires_at: {
               lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in less than 30 days
            }
         }
      })

      return records.map(
         (record) =>
            new KycCheck(
               record.id,
               record.account_id,
               record.check_type,
               record.related_document_id,
               record.provider,
               record.provider_reference_id,
               record.result,
               record.score ? Number(record.score) : null,
               record.raw_response,
               record.expires_at,
               record.created_at
            )
      )
   }

   async findLastDocumentByAccountId(accountId: string): Promise<KycDocument | null> {
      const record = await this.prisma.kyc_documents.findFirst({
         where: { account_id: accountId },
         orderBy: { created_at: 'desc' }
      })

      if (!record) return null

      return new KycDocument(
         record.id,
         record.account_id,
         record.doc_type,
         record.country_code,
         record.document_number_enc ? Buffer.from(record.document_number_enc) : null,
         record.file_url_front,
         record.file_url_back,
         record.issue_date,
         record.expiry_date,
         record.status,
         record.rejection_reason,
         record.reviewed_by,
         record.reviewed_at,
         record.created_at
      )
   }

   async findDocumentsByStatus(status: string): Promise<KycDocument[]> {
      const records = await this.prisma.kyc_documents.findMany({
         where: { status: status as kyc_doc_status },
         orderBy: { created_at: 'desc' }
      })

      return records.map(
         (record) =>
            new KycDocument(
               record.id,
               record.account_id,
               record.doc_type,
               record.country_code,
               record.document_number_enc ? Buffer.from(record.document_number_enc) : null,
               record.file_url_front,
               record.file_url_back,
               record.issue_date,
               record.expiry_date,
               record.status,
               record.rejection_reason,
               record.reviewed_by,
               record.reviewed_at,
               record.created_at
            )
      )
   }
}
