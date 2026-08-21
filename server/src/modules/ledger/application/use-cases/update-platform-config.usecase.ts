import { BadRequestException, Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { PlatformConfig } from '../../domain/entities/platform-config.entity'

export class UpdatePlatformConfigCommand {
   constructor(public readonly feeRules: Record<string, unknown>) {}
}

@Injectable()
export class UpdatePlatformConfigUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: UpdatePlatformConfigCommand): Promise<PlatformConfig> {
      // 1. Validate the fee rules payload
      if (
         !command.feeRules ||
         typeof command.feeRules !== 'object' ||
         Array.isArray(command.feeRules)
      ) {
         throw new BadRequestException('feeRules must be a JSON object')
      }

      // 2. Normalise numeric values so Prisma/JSONB can store them safely
      const normalised = this.normaliseJson(command.feeRules)

      // 3. Persist the updated fee rules and return the saved config
      return this.ledgerRepository.savePlatformConfig(normalised)
   }

   private normaliseJson(value: unknown): Record<string, unknown> {
      if (typeof value !== 'object' || value === null) return {}

      const result: Record<string, unknown> = {}
      for (const [key, item] of Object.entries(value)) {
         result[key] = typeof item === 'bigint' ? Number(item) : item
      }
      return result
   }
}
