import { Injectable } from '@nestjs/common'
import {
   SubmitGuestKycUseCase,
   SubmitKycCommand
} from '../../../kyc/application/use-cases/submit-guest-kyc.usecase'
import { KycDocType } from '../../../kyc/domain/entities/kyc-document.entity'
import { HostProfile, KycStatus } from '../../domain/entities/host-profile.entity'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'
import { EncryptionPort } from '../ports/encryption.port'
import {
   TaxInfoValidationFailedException,
   PayoutAccountValidationFailedException
} from '../../domain/errors/host-profile.errors'

export class RegisterHostIdentityInput {
   constructor(
      public readonly docType: KycDocType,
      public readonly countryCode: string | null,
      public readonly documentNumber: string | null,
      public readonly fileUrlFront: string,
      public readonly fileUrlBack: string | null,
      public readonly issueDate: Date | null,
      public readonly expiryDate: Date | null
   ) {}
}

export class RegisterHostCommand {
   constructor(
      public readonly accountId: string,
      public readonly identity: RegisterHostIdentityInput | null,
      public readonly taxCountry: string,
      public readonly taxId: string,
      public readonly taxFormType: string,
      public readonly payoutProvider: string,
      public readonly payoutAccountId: string
   ) {}
}

export class RegisterHostResult {
   constructor(
      public readonly accountId: string,
      public readonly kycStatus: KycStatus,
      public readonly taxVerified: boolean,
      public readonly payoutAccountVerified: boolean,
      public readonly becameHostAt: Date
   ) {}
}

@Injectable()
export class RegisterHostUseCase {
   constructor(
      private readonly hostProfileRepository: HostProfileRepository,
      private readonly encryptionPort: EncryptionPort,
      private readonly submitGuestKycUseCase: SubmitGuestKycUseCase
   ) {}

   async execute(command: RegisterHostCommand): Promise<RegisterHostResult> {
      // 1. Validate all inputs upfront before executing any side effects
      if (!command.taxCountry || command.taxCountry.length !== 2) {
         throw new TaxInfoValidationFailedException('Country code must be a 2-character string')
      }
      if (!command.taxId || command.taxId.trim().length < 5) {
         throw new TaxInfoValidationFailedException('Tax ID is too short or invalid')
      }
      if (!command.taxFormType || command.taxFormType.trim().length === 0) {
         throw new TaxInfoValidationFailedException('Tax form type is required')
      }
      if (!command.payoutProvider || command.payoutProvider.trim().length === 0) {
         throw new PayoutAccountValidationFailedException('Payout provider is required')
      }
      if (!command.payoutAccountId || command.payoutAccountId.trim().length === 0) {
         throw new PayoutAccountValidationFailedException('Payout account ID is required')
      }

      // 2. Create a new host profile or reuse the existing one
      let hostProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (!hostProfile) {
         const newProfile = HostProfile.create(command.accountId)
         hostProfile = await this.hostProfileRepository.save(newProfile)
         await this.hostProfileRepository.updateAccountRoleToHost(command.accountId)
      }

      // 3. Submit identity KYC document if the account is not yet identity-verified
      if (command.identity) {
         await this.submitGuestKycUseCase.execute(
            new SubmitKycCommand(
               command.accountId,
               command.identity.docType,
               command.identity.countryCode,
               command.identity.documentNumber,
               command.identity.fileUrlFront,
               command.identity.fileUrlBack,
               command.identity.issueDate,
               command.identity.expiryDate
            )
         )
      }

      // 4. Encrypt tax ID and apply verifyTax on the host profile entity
      const taxIdEnc = await this.encryptionPort.encrypt(command.taxId.trim())
      const guestKycStatus = await this.hostProfileRepository.getGuestKycStatus(command.accountId)

      const afterTax = hostProfile.verifyTax(
         command.taxCountry.toUpperCase(),
         taxIdEnc,
         command.taxFormType.trim(),
         guestKycStatus
      )

      // 5. Chain verifyPayout on the result of step 4
      const afterPayout = afterTax.verifyPayout(
         command.payoutProvider.trim().toLowerCase(),
         command.payoutAccountId.trim(),
         guestKycStatus
      )

      // 6. Persist the fully updated host profile
      const savedProfile = await this.hostProfileRepository.save(afterPayout)

      return new RegisterHostResult(
         savedProfile.accountId,
         savedProfile.kycStatus,
         savedProfile.taxVerified,
         savedProfile.payoutAccountVerified,
         savedProfile.becameHostAt
      )
   }
}
