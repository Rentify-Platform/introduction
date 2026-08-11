import { Injectable } from '@nestjs/common'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'
import { EncryptionPort } from '../ports/encryption.port'
import {
   HostProfileNotFoundException,
   TaxInfoValidationFailedException
} from '../../domain/errors/host-profile.errors'
import { KycStatus } from '../../domain/entities/host-profile.entity'

export class SubmitTaxInfoCommand {
   constructor(
      public readonly accountId: string,
      public readonly taxCountry: string,
      public readonly taxId: string,
      public readonly taxFormType: string
   ) {}
}

export class SubmitTaxInfoResult {
   constructor(
      public readonly accountId: string,
      public readonly taxCountry: string,
      public readonly taxFormType: string,
      public readonly taxVerified: boolean,
      public readonly kycStatus: KycStatus
   ) {}
}

@Injectable()
export class SubmitHostTaxInfoUseCase {
   constructor(
      private readonly hostProfileRepository: HostProfileRepository,
      private readonly encryptionPort: EncryptionPort
   ) {}

   async execute(command: SubmitTaxInfoCommand): Promise<SubmitTaxInfoResult> {
      // 1. Load host profile
      const hostProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (!hostProfile) {
         throw new HostProfileNotFoundException()
      }

      // Basic validation of inputs
      if (!command.taxCountry || command.taxCountry.length !== 2) {
         throw new TaxInfoValidationFailedException('Country code must be a 2-character string')
      }
      if (!command.taxId || command.taxId.trim().length < 5) {
         throw new TaxInfoValidationFailedException('Tax ID is too short or invalid')
      }
      if (!command.taxFormType || command.taxFormType.trim().length === 0) {
         throw new TaxInfoValidationFailedException('Tax form type is required')
      }

      // 2. Encrypt the Tax ID
      const taxIdEnc = await this.encryptionPort.encrypt(command.taxId.trim())

      // 3. Get the guest identity verification status
      const guestKycStatus = await this.hostProfileRepository.getGuestKycStatus(command.accountId)

      // 4. Update the entity domain logic
      const updatedProfile = hostProfile.verifyTax(
         command.taxCountry.toUpperCase(),
         taxIdEnc,
         command.taxFormType,
         guestKycStatus
      )

      // 5. Persist the updated host profile
      const savedProfile = await this.hostProfileRepository.save(updatedProfile)

      return new SubmitTaxInfoResult(
         savedProfile.accountId,
         savedProfile.taxCountry!,
         savedProfile.taxFormType!,
         savedProfile.taxVerified,
         savedProfile.kycStatus
      )
   }
}
