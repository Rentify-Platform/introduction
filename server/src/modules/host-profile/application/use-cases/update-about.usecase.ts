import { Injectable } from '@nestjs/common'
import { HostProfile } from '../../domain/entities/host-profile.entity'
import { HostProfileNotFoundException } from '../../domain/errors/host-profile.errors'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'

export class UpdateAboutCommand {
   constructor(
      public readonly accountId: string,
      public readonly about: string | null
   ) {}
}

@Injectable()
export class UpdateAboutUseCase {
   constructor(private readonly hostProfileRepository: HostProfileRepository) {}

   async execute(command: UpdateAboutCommand): Promise<HostProfile> {
      const hostProfile = await this.hostProfileRepository.findByAccountId(command.accountId)
      if (!hostProfile) {
         throw new HostProfileNotFoundException()
      }

      const updatedProfile = hostProfile.updateAbout(command.about)
      return this.hostProfileRepository.save(updatedProfile)
   }
}
