import { Module } from '@nestjs/common'
import { LedgerInfrastructureModule } from './infrastructure/ledger.infrastructure.module'
import { LedgerController } from './presentation/controllers/ledger.controller'
import { GetBalanceUseCase } from './application/use-cases/get-balance.usecase'
import { PostTransactionUseCase } from './application/use-cases/post-transaction.usecase'
import { TaxService } from './application/services/tax.service'
import { AuthModule } from '../auth/auth.module'

@Module({
   imports: [LedgerInfrastructureModule, AuthModule],
   controllers: [LedgerController],
   providers: [GetBalanceUseCase, PostTransactionUseCase, TaxService],
   exports: [GetBalanceUseCase, PostTransactionUseCase, TaxService, LedgerInfrastructureModule]
})
export class LedgerModule {}
