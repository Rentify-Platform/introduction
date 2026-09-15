import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

export interface VoidPenaltyCommand {
   penaltyId: string
   adminId: string
   reason: string
}

// The schema has no penalty enum. This is the only business value currently
// evidenced in the existing API contract (CreatePenaltyRequest).
export const HOST_PENALTY_TYPES = ['host_cancellation'] as const
export type HostPenaltyType = (typeof HOST_PENALTY_TYPES)[number]

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
      this.validateCreateCommand(command)

      const host = await this.prisma.accounts.findUnique({
         where: { id: command.hostId },
         select: {
            id: true,
            role: true,
            host_profiles: { select: { account_id: true } }
         }
      })

      if (!host) {
         throw new NotFoundException(`Host account ${command.hostId} not found`)
      }

      if (host.role !== 'host' || !host.host_profiles) {
         throw new BadRequestException(
            `Account ${command.hostId} must have the host role and a host profile`
         )
      }

      if (command.bookingId) {
         const booking = await this.prisma.bookings.findUnique({
            where: { id: command.bookingId },
            select: { id: true, host_id: true }
         })

         if (!booking) {
            throw new NotFoundException(`Booking ${command.bookingId} not found`)
         }

         if (booking.host_id !== command.hostId) {
            throw new BadRequestException('Booking does not belong to the selected host')
         }
      }

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

   async voidPenalty(command: VoidPenaltyCommand) {
      const reason = command.reason?.trim()
      if (!reason) {
         throw new BadRequestException('reason is required to void a penalty')
      }

      const admin = await this.prisma.accounts.findUnique({
         where: { id: command.adminId },
         select: { id: true, role: true, status: true }
      })
      if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
         throw new BadRequestException('Only an active admin can void a penalty')
      }

      const penalty = await this.prisma.host_penalties.findUnique({
         where: { id: command.penaltyId },
         select: { id: true, status: true }
      })
      if (!penalty) throw new NotFoundException(`Penalty ${command.penaltyId} not found`)
      if (penalty.status === 'voided') {
         throw new BadRequestException(`Penalty ${command.penaltyId} is already voided`)
      }

      const result = await this.prisma.host_penalties.updateMany({
         where: { id: command.penaltyId, status: 'active' },
         data: {
            status: 'voided',
            voided_at: new Date(),
            void_reason: reason,
            voided_by_admin_id: command.adminId
         }
      })

      if (result.count === 0) {
         throw new BadRequestException(`Penalty ${command.penaltyId} is already voided`)
      }

      return this.prisma.host_penalties.findUniqueOrThrow({
         where: { id: command.penaltyId }
      })
   }

   private validateCreateCommand(command: CreatePenaltyCommand): void {
      if (
         typeof command.amountCents !== 'number' ||
         !Number.isFinite(command.amountCents) ||
         !Number.isSafeInteger(command.amountCents) ||
         command.amountCents < 0
      ) {
         throw new BadRequestException('amountCents must be a finite non-negative integer')
      }

      if (!HOST_PENALTY_TYPES.includes(command.penaltyType as HostPenaltyType)) {
         throw new BadRequestException(`Unsupported penalty type: ${command.penaltyType}`)
      }
   }
}
