import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { KycProviderPort } from '../../application/ports/kyc-provider.port'
import { KycCheckResult } from '../../domain/entities/kyc-check.entity'
import { KycDocument } from '../../domain/entities/kyc-document.entity'

@Injectable()
export class MockKycProvider implements KycProviderPort {
   async verifyIdentity(document: KycDocument): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: any
   }> {
      const url = document.fileUrlFront.toLowerCase()

      let result: KycCheckResult = 'review_required'
      let score = 65

      if (url.includes('fail')) {
         result = 'fail'
         score = 25
      }

      return {
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
      }
   }

   async runBackgroundCheck(accountId: string): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: any
   }> {
      return {
         result: 'pass',
         score: 100,
         providerReferenceId: `bg-check-${randomUUID()}`,
         rawResponse: {
            provider: 'MockBackgroundCheck',
            criminalRecordFound: false,
            evaluatedAt: new Date().toISOString()
         }
      }
   }
}
