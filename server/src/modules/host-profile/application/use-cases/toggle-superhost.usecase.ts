import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

export interface ToggleSuperhostCommand {
   accountId: string
   isSuperhost: boolean
}

@Injectable()
export class ToggleSuperhostUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async execute(command: ToggleSuperhostCommand): Promise<void> {
      const hostProfile = await this.prisma.host_profiles.findUnique({
         where: { account_id: command.accountId }
      })

      if (!hostProfile) {
         throw new NotFoundException(`Host profile not found for account ${command.accountId}`)
      }

      await this.prisma.host_profiles.update({
         where: { account_id: command.accountId },
         data: { is_superhost: command.isSuperhost, updated_at: new Date() }
      })
   }
}
