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

      this.validatePercentageRules(command.feeRules)

      // 2. Normalise numeric values so Prisma/JSONB can store them safely.
      const normalised = this.normaliseJson(command.feeRules)

      // 3. Persist the updated fee rules and return the saved config
      return this.ledgerRepository.savePlatformConfig(normalised)
   }

   private normaliseJson(value: unknown): Record<string, unknown> {
      if (!this.isJsonObject(value)) {
         throw new BadRequestException('feeRules must contain only JSON-compatible values')
      }

      return this.normaliseObject(value as Record<string, unknown>)
   }

   private normaliseObject(value: Record<string, unknown>): Record<string, unknown> {
      return Object.fromEntries(
         Object.entries(value).map(([key, item]) => [key, this.normaliseValue(item)])
      )
   }

   private normaliseValue(value: unknown): unknown {
      if (typeof value === 'bigint') return Number(value)
      if (Array.isArray(value)) return value.map((item) => this.normaliseValue(item))
      if (value !== null && typeof value === 'object') {
         return this.normaliseObject(value as Record<string, unknown>)
      }
      return value
   }

   private isJsonObject(value: unknown): boolean {
      if (value === null || typeof value !== 'object') return false
      if (Array.isArray(value)) {
         return value.every((item) => this.isJsonValue(item))
      }

      return Object.entries(value).every(([, item]) => this.isJsonValue(item))
   }

   private validatePercentageRules(value: Record<string, unknown>): void {
      for (const [key, item] of Object.entries(value)) {
         if (key.endsWith('_pct') && (typeof item !== 'number' || item < 0 || item > 100)) {
            throw new BadRequestException(`${key} must be a number between 0 and 100`)
         }
         if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            this.validatePercentageRules(item as Record<string, unknown>)
         }
         if (Array.isArray(item)) {
            item.forEach((nested) => {
               if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
                  this.validatePercentageRules(nested as Record<string, unknown>)
               }
            })
         }
      }
   }

   private isJsonValue(value: unknown): boolean {
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
      if (typeof value === 'number') return Number.isFinite(value)
      if (typeof value === 'bigint') return Number.isSafeInteger(value)
      if (Array.isArray(value)) return value.every((item) => this.isJsonValue(item))
      if (typeof value === 'object') {
         return Object.entries(value).every(([, item]) => this.isJsonValue(item))
      }
      return false
   }
}
