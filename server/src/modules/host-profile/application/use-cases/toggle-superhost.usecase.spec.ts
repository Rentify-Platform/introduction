import { BadRequestException, NotFoundException } from '@nestjs/common'

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../../../../prisma/prisma.service'
import { ToggleSuperhostUseCase } from './toggle-superhost.usecase'

function makePrisma() {
   return {
      accounts: { findUnique: jest.fn() },
      host_profiles: { findUnique: jest.fn(), update: jest.fn() }
   }
}

describe('ToggleSuperhostUseCase', () => {
   it('updates an active host and records admin reason', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique
         .mockResolvedValueOnce({ role: 'admin', status: 'active' })
         .mockResolvedValueOnce({ role: 'host', status: 'active' })
      prisma.host_profiles.findUnique.mockResolvedValue({ account_id: 'host-1' })
      const useCase = new ToggleSuperhostUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.execute({
            accountId: 'host-1',
            isSuperhost: true,
            adminId: 'admin-1',
            reason: 'Requirements reviewed'
         })
      ).resolves.toBeUndefined()

      expect(prisma.host_profiles.update).toHaveBeenCalledWith(
         expect.objectContaining({
            where: { account_id: 'host-1' },
            data: expect.objectContaining({
               is_superhost: true,
               superhost_update_reason: 'Requirements reviewed',
               superhost_updated_by_admin_id: 'admin-1'
            })
         })
      )
   })

   it('rejects a missing reason before changing data', async () => {
      const prisma = makePrisma()
      const useCase = new ToggleSuperhostUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.execute({
            accountId: 'host-1',
            isSuperhost: true,
            adminId: 'admin-1',
            reason: '  '
         })
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.host_profiles.update).not.toHaveBeenCalled()
   })

   it('rejects inactive or non-admin actor', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({ role: 'admin', status: 'suspended' })
      const useCase = new ToggleSuperhostUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.execute({
            accountId: 'host-1',
            isSuperhost: true,
            adminId: 'admin-1',
            reason: 'Reason'
         })
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.host_profiles.update).not.toHaveBeenCalled()
   })

   it('rejects a missing host profile', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique.mockResolvedValue({ role: 'admin', status: 'active' })
      prisma.host_profiles.findUnique.mockResolvedValue(null)
      const useCase = new ToggleSuperhostUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.execute({
            accountId: 'host-1',
            isSuperhost: true,
            adminId: 'admin-1',
            reason: 'Reason'
         })
      ).rejects.toBeInstanceOf(NotFoundException)
   })

   it('rejects inactive target host', async () => {
      const prisma = makePrisma()
      prisma.accounts.findUnique
         .mockResolvedValueOnce({ role: 'admin', status: 'active' })
         .mockResolvedValueOnce({ role: 'host', status: 'banned' })
      prisma.host_profiles.findUnique.mockResolvedValue({ account_id: 'host-1' })
      const useCase = new ToggleSuperhostUseCase(prisma as unknown as PrismaService)

      await expect(
         useCase.execute({
            accountId: 'host-1',
            isSuperhost: true,
            adminId: 'admin-1',
            reason: 'Reason'
         })
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.host_profiles.update).not.toHaveBeenCalled()
   })
})
