import { KycCheckResult } from '../../domain/entities/kyc-check.entity'
import { KycDocument } from '../../domain/entities/kyc-document.entity'

export abstract class KycProviderPort {
   abstract verifyIdentity(document: KycDocument): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: any
   }>

   abstract runBackgroundCheck(accountId: string): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: any
   }>
}
