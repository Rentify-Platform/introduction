import { Injectable } from '@nestjs/common'
import { HostProfile } from '../../domain/entities/host-profile.entity'
import { HostProfileNotFoundException } from '../../domain/errors/host-profile.errors'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'

export class GetHostProfileCommand {
   constructor(public readonly accountId: string) {}
}

@Injectable()
export class GetHostProfileUseCase {
   constructor(private readonly hostProfileRepository: HostProfileRepository) {}

   async execute(command: GetHostProfileCommand): Promise<HostProfile> {
      const hostProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (!hostProfile) {
         throw new HostProfileNotFoundException()
      }
      return hostProfile
   }
}
