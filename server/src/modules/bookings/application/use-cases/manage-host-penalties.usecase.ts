import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

export interface CreatePenaltyCommand {
   hostId: string
   bookingId?: string
   penaltyType: string
   amountCents: number
   notes?: string
}

@Injectable()
export class ManageHostPenaltiesUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async listPenalties(hostId?: string, page: number = 1, limit: number = 20) {
      const skip = (page - 1) * limit
      const where = hostId ? { host_id: hostId } : {}

      const [data, total] = await Promise.all([
         this.prisma.host_penalties.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
               accounts: {
                  select: {
                     profiles: { select: { first_name: true, last_name: true } },
                     email: true
                  }
               },
               bookings: {
                  select: { id: true, property_id: true }
               }
            }
         }),
         this.prisma.host_penalties.count({ where })
      ])

      return { data, total, page, limit }
   }

   async createPenalty(command: CreatePenaltyCommand) {
      return await this.prisma.host_penalties.create({
         data: {
            host_id: command.hostId,
            booking_id: command.bookingId || null,
            penalty_type: command.penaltyType,
            amount_cents: command.amountCents,
            notes: command.notes
         }
      })
   }

   async deletePenalty(penaltyId: string) {
      return await this.prisma.host_penalties.delete({
         where: { id: penaltyId }
      })
   }
}
