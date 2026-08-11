import { Injectable } from '@nestjs/common'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'
import {
   HostProfileNotFoundException,
   PayoutAccountValidationFailedException
} from '../../domain/errors/host-profile.errors'
import { KycStatus } from '../../domain/entities/host-profile.entity'

export class SetupPayoutCommand {
   constructor(
      public readonly accountId: string,
      public readonly payoutProvider: string,
      public readonly payoutAccountId: string
   ) {}
}

export class SetupPayoutResult {
   constructor(
      public readonly accountId: string,
      public readonly payoutProvider: string,
      public readonly payoutAccountId: string,
      public readonly payoutAccountVerified: boolean,
      public readonly kycStatus: KycStatus
   ) {}
}

@Injectable()
export class SetupHostPayoutUseCase {
   constructor(private readonly hostProfileRepository: HostProfileRepository) {}

   async execute(command: SetupPayoutCommand): Promise<SetupPayoutResult> {
      // 1. Load host profile
      const hostProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (!hostProfile) {
         throw new HostProfileNotFoundException()
      }

      // Basic validation
      if (!command.payoutProvider || command.payoutProvider.trim().length === 0) {
         throw new PayoutAccountValidationFailedException('Payout provider is required')
      }
      if (!command.payoutAccountId || command.payoutAccountId.trim().length === 0) {
         throw new PayoutAccountValidationFailedException('Payout account ID is required')
      }

      // 2. Get the guest identity verification status
      const guestKycStatus = await this.hostProfileRepository.getGuestKycStatus(command.accountId)

      // 3. Update the entity domain logic
      const updatedProfile = hostProfile.verifyPayout(
         command.payoutProvider.trim().toLowerCase(),
         command.payoutAccountId.trim(),
         guestKycStatus
      )

      // 4. Persist the updated host profile
      const savedProfile = await this.hostProfileRepository.save(updatedProfile)

      return new SetupPayoutResult(
         savedProfile.accountId,
         savedProfile.payoutProvider!,
         savedProfile.payoutAccountId!,
         savedProfile.payoutAccountVerified,
         savedProfile.kycStatus
      )
   }
}
