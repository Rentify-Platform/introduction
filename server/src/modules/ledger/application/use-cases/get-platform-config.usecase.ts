import { Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { PlatformConfig } from '../../domain/entities/platform-config.entity'

@Injectable()
export class GetPlatformConfigUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(): Promise<PlatformConfig> {
      // 1. Fetch the singleton platform config row
      const config = await this.ledgerRepository.findPlatformConfig()

      // 2. Fall back to empty fee rules when no config row exists
      return config ?? new PlatformConfig({}, new Date())
   }
}
