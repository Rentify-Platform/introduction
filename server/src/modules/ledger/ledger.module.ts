import { Module } from '@nestjs/common'
import { LedgerInfrastructureModule } from './infrastructure/ledger.infrastructure.module'
import { LedgerController } from './presentation/controllers/ledger.controller'
import { AdminLedgerController } from './presentation/controllers/admin-ledger.controller'
import { GetBalanceUseCase } from './application/use-cases/get-balance.usecase'
import { PostTransactionUseCase } from './application/use-cases/post-transaction.usecase'
import { ListAllTransactionsUseCase } from './application/use-cases/list-all-transactions.usecase'
import { ListAllBalancesUseCase } from './application/use-cases/list-all-balances.usecase'
import { ListAllPayoutsUseCase } from './application/use-cases/list-all-payouts.usecase'
import { GetPlatformConfigUseCase } from './application/use-cases/get-platform-config.usecase'
import { UpdatePlatformConfigUseCase } from './application/use-cases/update-platform-config.usecase'
import { TaxService } from './application/services/tax.service'
import { AuthModule } from '../auth/auth.module'

@Module({
   imports: [LedgerInfrastructureModule, AuthModule],
   controllers: [LedgerController, AdminLedgerController],
   providers: [
      GetBalanceUseCase,
      PostTransactionUseCase,
      ListAllTransactionsUseCase,
      ListAllBalancesUseCase,
      ListAllPayoutsUseCase,
      GetPlatformConfigUseCase,
      UpdatePlatformConfigUseCase,
      TaxService
   ],
   exports: [GetBalanceUseCase, PostTransactionUseCase, TaxService, LedgerInfrastructureModule]
})
export class LedgerModule {}
