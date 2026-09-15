import { BadRequestException } from '@nestjs/common'

/* eslint-disable @typescript-eslint/unbound-method */
import {
   UpdatePlatformConfigCommand,
   UpdatePlatformConfigUseCase
} from './update-platform-config.usecase'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { PlatformConfig } from '../../domain/entities/platform-config.entity'

function createRepository() {
   return {
      savePlatformConfig: jest.fn((feeRules: Record<string, unknown>) =>
         Promise.resolve(new PlatformConfig(feeRules, new Date('2026-09-15T00:00:00.000Z')))
      )
   } as unknown as jest.Mocked<LedgerRepository>
}

describe('UpdatePlatformConfigUseCase', () => {
   it('persists a valid nested JSON fee rule payload', async () => {
      const repository = createRepository()
      const useCase = new UpdatePlatformConfigUseCase(repository)

      const result = await useCase.execute(
         new UpdatePlatformConfigCommand({
            default_pct: 12,
            cancellation: { guest_pct: 80, host_pct: 10, platform_pct: 10 },
            enabled: true
         })
      )

      expect(result.feeRules).toEqual({
         default_pct: 12,
         cancellation: { guest_pct: 80, host_pct: 10, platform_pct: 10 },
         enabled: true
      })
      expect(jest.mocked(repository.savePlatformConfig)).toHaveBeenCalledWith(result.feeRules)
   })

   it.each([null, [], 'rules', 12, true])('rejects non-object feeRules: %p', async (value) => {
      const repository = createRepository()
      const useCase = new UpdatePlatformConfigUseCase(repository)

      await expect(
         useCase.execute(
            new UpdatePlatformConfigCommand(value as unknown as Record<string, unknown>)
         )
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(jest.mocked(repository.savePlatformConfig)).not.toHaveBeenCalled()
   })

   it.each([-1, 101, '12'])('rejects percentage outside the domain schema: %p', async (value) => {
      const repository = createRepository()
      const useCase = new UpdatePlatformConfigUseCase(repository)

      await expect(
         useCase.execute(new UpdatePlatformConfigCommand({ default_pct: value }))
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(jest.mocked(repository.savePlatformConfig)).not.toHaveBeenCalled()
   })

   it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'rejects non-finite numeric values: %p',
      async (value) => {
         const repository = createRepository()
         const useCase = new UpdatePlatformConfigUseCase(repository)

         await expect(
            useCase.execute(new UpdatePlatformConfigCommand({ default_pct: value }))
         ).rejects.toBeInstanceOf(BadRequestException)
         expect(jest.mocked(repository.savePlatformConfig)).not.toHaveBeenCalled()
      }
   )

   it('propagates repository failures without swallowing them', async () => {
      const repository = createRepository()
      const failure = new Error('database unavailable')
      jest.mocked(repository.savePlatformConfig).mockRejectedValue(failure)
      const useCase = new UpdatePlatformConfigUseCase(repository)

      await expect(
         useCase.execute(new UpdatePlatformConfigCommand({ default_pct: 12 }))
      ).rejects.toBe(failure)
   })
})
