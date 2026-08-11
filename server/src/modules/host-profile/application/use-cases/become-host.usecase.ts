import { Injectable } from '@nestjs/common'
import { HostProfile, KycStatus } from '../../domain/entities/host-profile.entity'
import { HostProfileAlreadyExistsException } from '../../domain/errors/host-profile.errors'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'

export class BecomeHostCommand {
   constructor(public readonly accountId: string) {}
}

export class BecomeHostResult {
   constructor(
      public readonly accountId: string,
      public readonly kycStatus: KycStatus,
      public readonly becameHostAt: Date
   ) {}
}

@Injectable()
export class BecomeHostUseCase {
   constructor(private readonly hostProfileRepository: HostProfileRepository) {}

   async execute(command: BecomeHostCommand): Promise<BecomeHostResult> {
      // 1. Check if host profile already exists
      const existingProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (existingProfile) {
         throw new HostProfileAlreadyExistsException()
      }

      // 2. Create new HostProfile domain entity
      const newProfile = HostProfile.create(command.accountId)

      // 3. Save profile in the database
      const savedProfile = await this.hostProfileRepository.save(newProfile)

      // 4. Update the account role to 'host' in the database
      await this.hostProfileRepository.updateAccountRoleToHost(command.accountId)

      return new BecomeHostResult(
         savedProfile.accountId,
         savedProfile.kycStatus,
         savedProfile.becameHostAt
      )
   }
}
