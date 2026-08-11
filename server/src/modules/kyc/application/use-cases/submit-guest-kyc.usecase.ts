import { Injectable } from '@nestjs/common'
import { KycCheck, KycCheckResult } from '../../domain/entities/kyc-check.entity'
import { KycDocStatus, KycDocType, KycDocument } from '../../domain/entities/kyc-document.entity'
import { KycAlreadyVerifiedException } from '../../domain/errors/kyc.errors'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { KycProviderPort } from '../ports/kyc-provider.port'

export class SubmitKycCommand {
   constructor(
      public readonly accountId: string,
      public readonly docType: KycDocType,
      public readonly countryCode: string | null,
      public readonly documentNumber: string | null,
      public readonly fileUrlFront: string,
      public readonly fileUrlBack: string | null,
      public readonly issueDate: Date | null,
      public readonly expiryDate: Date | null
   ) {}
}

export class SubmitKycResult {
   constructor(
      public readonly documentId: string,
      public readonly status: KycDocStatus,
      public readonly verificationResult: KycCheckResult
   ) {}
}

@Injectable()
export class SubmitGuestKycUseCase {
   constructor(
      private readonly kycRepository: KycRepository,
      private readonly kycProvider: KycProviderPort
   ) {}

   async execute(command: SubmitKycCommand): Promise<SubmitKycResult> {
      // 1. Check if user is already verified
      const lastDoc = await this.kycRepository.findLastDocumentByAccountId(command.accountId)
      if (lastDoc && lastDoc.status === 'verified') {
         throw new KycAlreadyVerifiedException()
      }

      // 2. Create document entity
      const document = KycDocument.create({
         accountId: command.accountId,
         docType: command.docType,
         countryCode: command.countryCode,
         documentNumber: command.documentNumber,
         fileUrlFront: command.fileUrlFront,
         fileUrlBack: command.fileUrlBack,
         issueDate: command.issueDate,
         expiryDate: command.expiryDate
      })

      // Save document initially with status 'pending'
      await this.kycRepository.saveDocument(document)
      await this.kycRepository.updateProfileKycStatus(command.accountId, 'pending')

      // 3. Call external KYC provider to verify identity
      let providerResult: {
         result: KycCheckResult
         score: number
         providerReferenceId: string
         rawResponse: any
      }
      try {
         providerResult = await this.kycProvider.verifyIdentity(document)
      } catch (err) {
         // If external call fails, we keep it as pending/review_required
         providerResult = {
            result: 'review_required',
            score: 0,
            providerReferenceId: 'ERROR_AUTO_TRIGGER',
            rawResponse: { error: err instanceof Error ? err.message : 'Unknown provider error' }
         }
      }

      // 4. Record the check
      const check = KycCheck.create({
         accountId: command.accountId,
         checkType: 'identity_document',
         relatedDocumentId: document.id,
         provider: 'mock-kyc-provider',
         providerReferenceId: providerResult.providerReferenceId,
         result: providerResult.result,
         score: providerResult.score,
         rawResponse: providerResult.rawResponse
      })
      await this.kycRepository.saveCheck(check)

      // 5. Update document & profile status based on results
      let finalDocStatus: KycDocStatus = 'pending'
      let finalProfileStatus: 'pending' | 'verified' | 'rejected' = 'pending'

      if (providerResult.result === 'pass') {
         finalDocStatus = 'verified'
         finalProfileStatus = 'verified'
      } else if (providerResult.result === 'fail') {
         finalDocStatus = 'rejected'
         finalProfileStatus = 'rejected'
      }

      const updatedDoc = new KycDocument(
         document.id,
         document.accountId,
         document.docType,
         document.countryCode,
         document.documentNumberEnc,
         document.fileUrlFront,
         document.fileUrlBack,
         document.issueDate,
         document.expiryDate,
         finalDocStatus,
         providerResult.result === 'fail' ? 'Automated check failed' : null,
         null,
         null,
         document.createdAt
      )

      await this.kycRepository.saveDocument(updatedDoc)
      await this.kycRepository.updateProfileKycStatus(command.accountId, finalProfileStatus)

      return new SubmitKycResult(updatedDoc.id, updatedDoc.status, providerResult.result)
   }
}
