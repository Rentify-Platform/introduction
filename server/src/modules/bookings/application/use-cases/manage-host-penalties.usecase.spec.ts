import { BadRequestException, NotFoundException } from '@nestjs/common'

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../../../../prisma/prisma.service'
import { CreatePenaltyCommand, ManageHostPenaltiesUseCase } from './manage-host-penalties.usecase'

const makePrisma = () => ({
   accounts: { findUnique: jest.fn() },
   bookings: { findUnique: jest.fn() },
   host_penalties: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn()
   }
})

const validCommand = (overrides: Partial<CreatePenaltyCommand> = {}): CreatePenaltyCommand => ({
   hostId: 'host-1',
   bookingId: 'booking-1',
   penaltyType: 'host_cancellation',
   amountCents: 500000,
   ...overrides
})

describe('ManageHostPenaltiesUseCase', () => {
   it('creates a penalty for a host and a booking owned by that host', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'host-1',
         role: 'host',
         host_profiles: { account_id: 'host-1' }
      })
      prisma.bookings.findUnique.mockResolvedValue({ id: 'booking-1', host_id: 'host-1' })
      prisma.host_penalties.create.mockResolvedValue({ id: 'penalty-1' })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(useCase.createPenalty(validCommand())).resolves.toEqual({ id: 'penalty-1' })
      expect(prisma.host_penalties.create).toHaveBeenCalledWith({
         data: {
            host_id: 'host-1',
            booking_id: 'booking-1',
            penalty_type: 'host_cancellation',
            amount_cents: 500000,
            notes: undefined
         }
      })
   })

   it('creates a penalty without a booking when the optional bookingId is omitted', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'host-1',
         role: 'host',
         host_profiles: { account_id: 'host-1' }
      })
      prisma.host_penalties.create.mockResolvedValue({ id: 'penalty-1' })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await useCase.createPenalty(validCommand({ bookingId: undefined, amountCents: 0 }))

      expect(prisma.bookings.findUnique).not.toHaveBeenCalled()
      expect(prisma.host_penalties.create).toHaveBeenCalledWith({
         data: {
            host_id: 'host-1',
            booking_id: null,
            penalty_type: 'host_cancellation',
            amount_cents: 0,
            notes: undefined
         }
      })
   })

   it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
      'rejects a non-finite, negative, unsafe, or non-integer amount: %p',
      async (amountCents) => {
         const prisma = makePrisma()
         const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

         await expect(useCase.createPenalty(validCommand({ amountCents }))).rejects.toThrow(
            new BadRequestException('amountCents must be a finite non-negative integer')
         )
         expect(prisma.accounts.findUnique).not.toHaveBeenCalled()
      }
   )

   it('rejects a penalty type not evidenced by the business contract', async () => {
      const prisma = makePrisma()
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.createPenalty(validCommand({ penaltyType: 'made-up-type' }))
      ).rejects.toThrow(new BadRequestException('Unsupported penalty type: made-up-type'))
      expect(prisma.accounts.findUnique).not.toHaveBeenCalled()
   })

   it('rejects a missing host account', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue(null)
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(useCase.createPenalty(validCommand())).rejects.toThrow(
         new NotFoundException('Host account host-1 not found')
      )
      expect(prisma.host_penalties.create).not.toHaveBeenCalled()
   })

   it.each([
      { role: 'guest', host_profiles: { account_id: 'host-1' } },
      { role: 'host', host_profiles: null }
   ])('rejects an account that is not a complete host', async (account) => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({ id: 'host-1', ...account })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(useCase.createPenalty(validCommand())).rejects.toThrow(BadRequestException)
      expect(prisma.bookings.findUnique).not.toHaveBeenCalled()
   })

   it('rejects a missing booking', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'host-1',
         role: 'host',
         host_profiles: { account_id: 'host-1' }
      })
      prisma.bookings.findUnique.mockResolvedValue(null)
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(useCase.createPenalty(validCommand())).rejects.toThrow(
         new NotFoundException('Booking booking-1 not found')
      )
      expect(prisma.host_penalties.create).not.toHaveBeenCalled()
   })

   it('rejects a booking belonging to another host', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'host-1',
         role: 'host',
         host_profiles: { account_id: 'host-1' }
      })
      prisma.bookings.findUnique.mockResolvedValue({ id: 'booking-1', host_id: 'other-host' })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(useCase.createPenalty(validCommand())).rejects.toThrow(
         new BadRequestException('Booking does not belong to the selected host')
      )
      expect(prisma.host_penalties.create).not.toHaveBeenCalled()
   })

   it('voids an active penalty with admin actor and reason', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'admin-1',
         role: 'admin',
         status: 'active'
      })
      prisma.host_penalties.findUnique.mockResolvedValue({ id: 'penalty-1', status: 'active' })
      prisma.host_penalties.updateMany.mockResolvedValue({ count: 1 })
      prisma.host_penalties.findUniqueOrThrow.mockResolvedValue({
         id: 'penalty-1',
         status: 'voided',
         voided_at: new Date('2026-09-15T00:00:00.000Z')
      })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.voidPenalty({
            penaltyId: 'penalty-1',
            adminId: 'admin-1',
            reason: 'Created in error'
         })
      ).resolves.toMatchObject({ id: 'penalty-1', status: 'voided' })
      expect(prisma.host_penalties.updateMany).toHaveBeenCalledWith(
         expect.objectContaining({
            where: { id: 'penalty-1', status: 'active' },
            data: expect.objectContaining({
               status: 'voided',
               void_reason: 'Created in error',
               voided_by_admin_id: 'admin-1'
            })
         })
      )
   })

   it.each(['', '   '])('rejects void without a reason: %j', async (reason) => {
      const prisma = makePrisma()
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.voidPenalty({ penaltyId: 'penalty-1', adminId: 'admin-1', reason })
      ).rejects.toThrow(BadRequestException)
      expect(prisma.host_penalties.updateMany).not.toHaveBeenCalled()
   })

   it('rejects a concurrent void after another request wins the atomic update', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'admin-1',
         role: 'admin',
         status: 'active'
      })
      prisma.host_penalties.findUnique.mockResolvedValue({ id: 'penalty-1', status: 'active' })
      prisma.host_penalties.updateMany.mockResolvedValue({ count: 0 })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.voidPenalty({ penaltyId: 'penalty-1', adminId: 'admin-1', reason: 'Duplicate' })
      ).rejects.toThrow(BadRequestException)
      expect(prisma.host_penalties.findUniqueOrThrow).not.toHaveBeenCalled()
   })

   it('rejects voiding a penalty twice', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({
         id: 'admin-1',
         role: 'admin',
         status: 'active'
      })
      prisma.host_penalties.findUnique.mockResolvedValue({ id: 'penalty-1', status: 'voided' })
      const useCase = new ManageHostPenaltiesUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.voidPenalty({ penaltyId: 'penalty-1', adminId: 'admin-1', reason: 'Duplicate' })
      ).rejects.toThrow(BadRequestException)
   })
})
