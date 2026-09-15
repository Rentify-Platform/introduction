import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

export interface ToggleSuperhostCommand {
   accountId: string
   isSuperhost: boolean
   adminId: string
   reason: string
}

@Injectable()
export class ToggleSuperhostUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async execute(command: ToggleSuperhostCommand): Promise<void> {
      const reason = command.reason?.trim()
      if (!reason) {
         throw new BadRequestException('reason is required to change superhost status')
      }

      const [admin, hostProfile] = await Promise.all([
         this.prisma.accounts.findUnique({
            where: { id: command.adminId },
            select: { role: true, status: true }
         }),
         this.prisma.host_profiles.findUnique({
            where: { account_id: command.accountId }
         })
      ])

      if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
         throw new BadRequestException('Only an active admin can change superhost status')
      }
      if (!hostProfile) {
         throw new NotFoundException(`Host profile not found for account ${command.accountId}`)
      }

      const host = await this.prisma.accounts.findUnique({
         where: { id: command.accountId },
         select: { role: true, status: true }
      })
      if (!host || host.role !== 'host' || host.status !== 'active') {
         throw new BadRequestException('Only an active host can be a superhost')
      }

      await this.prisma.host_profiles.update({
         where: { account_id: command.accountId },
         data: {
            is_superhost: command.isSuperhost,
            superhost_updated_at: new Date(),
            superhost_update_reason: reason,
            superhost_updated_by_admin_id: command.adminId,
            updated_at: new Date()
         }
      })
   }
}
