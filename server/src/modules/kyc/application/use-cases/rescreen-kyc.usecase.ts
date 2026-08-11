import { Injectable } from '@nestjs/common'
import { KycCheck } from '../../domain/entities/kyc-check.entity'
import { KycRepository } from '../../domain/repositories/kyc.repository'
import { KycProviderPort } from '../ports/kyc-provider.port'

export class RescreenKycCommand {
   // Empty constructor since it runs broadly for all expiring checks
}

export class RescreenKycResult {
   constructor(
      public readonly totalRescreened: number,
      public readonly passedCount: number,
      public readonly failedCount: number
   ) {}
}

@Injectable()
export class RescreenKycUseCase {
   constructor(
      private readonly kycRepository: KycRepository,
      private readonly kycProvider: KycProviderPort
   ) {}

   async execute(command: RescreenKycCommand): Promise<RescreenKycResult> {
      // 1. Fetch expiring checks
      const expiringChecks = await this.kycRepository.findExpiringBackgroundChecks()
      if (expiringChecks.length === 0) {
         return new RescreenKycResult(0, 0, 0)
      }

      let passedCount = 0
      let failedCount = 0

      // 2. Loop and re-screen
      for (const check of expiringChecks) {
         try {
            const result = await this.kycProvider.runBackgroundCheck(check.accountId)

            const newCheck = KycCheck.create({
               accountId: check.accountId,
               checkType: 'background_check',
               relatedDocumentId: check.relatedDocumentId,
               provider: 'mock-kyc-provider',
               providerReferenceId: result.providerReferenceId,
               result: result.result,
               score: result.score,
               rawResponse: result.rawResponse,
               expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // expires in 1 year
            })

            await this.kycRepository.saveCheck(newCheck)

            // Update profile status if background check fails
            if (result.result === 'pass') {
               passedCount++
               await this.kycRepository.updateProfileKycStatus(check.accountId, 'verified')
            } else if (result.result === 'fail') {
               failedCount++
               await this.kycRepository.updateProfileKycStatus(check.accountId, 'rejected')
            }
         } catch (err) {
            // Log error and continue to next check to avoid blocking the whole batch
            console.error(`Failed to rescreen account ${check.accountId}:`, err)
         }
      }

      return new RescreenKycResult(expiringChecks.length, passedCount, failedCount)
   }
}
