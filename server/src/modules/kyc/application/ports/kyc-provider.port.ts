import { KycCheckResult, KycJsonValue } from '../../domain/entities/kyc-check.entity'
import { KycDocument } from '../../domain/entities/kyc-document.entity'

export type KycProviderRawResponse = { [key: string]: KycJsonValue }

export abstract class KycProviderPort {
   abstract verifyIdentity(document: KycDocument): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: KycProviderRawResponse
   }>

   abstract runBackgroundCheck(accountId: string): Promise<{
      result: KycCheckResult
      score: number
      providerReferenceId: string
      rawResponse: KycProviderRawResponse
   }>
}
