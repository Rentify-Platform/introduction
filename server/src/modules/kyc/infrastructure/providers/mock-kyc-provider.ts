import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { KycProviderPort, KycProviderRawResponse } from '../../application/ports/kyc-provider.port'
import { KycCheckResult } from '../../domain/entities/kyc-check.entity'
import { KycDocument } from '../../domain/entities/kyc-document.entity'

@Injectable()
export class MockKycProvider implements KycProviderPort {
   verifyIdentity(document: KycDocument): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: KycProviderRawResponse
   }> {
      const url = document.fileUrlFront.toLowerCase()

      let result: KycCheckResult = 'review_required'
      let score = 65

      if (url.includes('fail')) {
         result = 'fail'
         score = 25
      }

      return Promise.resolve({
         result,
         score,
         providerReferenceId: `provider-ref-${randomUUID()}`,
         rawResponse: {
            provider: 'MockIdentityCheck',
            evaluatedAt: new Date().toISOString(),
            checks: {
               faceMatch: score > 50,
               documentAuthenticity: score > 30
            }
         }
      })
   }

   runBackgroundCheck(accountId: string): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: KycProviderRawResponse
   }> {
      void accountId

      return Promise.resolve({
         result: 'pass',
         score: 100,
         providerReferenceId: `bg-check-${randomUUID()}`,
         rawResponse: {
            provider: 'MockBackgroundCheck',
            criminalRecordFound: false,
            evaluatedAt: new Date().toISOString()
         }
      })
   }
}
