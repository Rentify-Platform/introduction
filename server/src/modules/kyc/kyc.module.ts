import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { KycInfrastructureModule } from './infrastructure/kyc.infrastructure.module'
import { GuestKycController } from './presentation/controllers/guest-kyc.controller'
import { AdminKycController } from './presentation/controllers/admin-kyc.controller'
import { SubmitGuestKycUseCase } from './application/use-cases/submit-guest-kyc.usecase'
import { ReviewKycUseCase } from './application/use-cases/review-kyc.usecase'
import { RescreenKycUseCase } from './application/use-cases/rescreen-kyc.usecase'
import { GetPendingKycUseCase } from './application/use-cases/get-pending-kyc.usecase'

@Module({
   imports: [KycInfrastructureModule, AuthModule],
   controllers: [GuestKycController, AdminKycController],
   providers: [SubmitGuestKycUseCase, ReviewKycUseCase, RescreenKycUseCase, GetPendingKycUseCase],
   exports: [
      SubmitGuestKycUseCase,
      ReviewKycUseCase,
      RescreenKycUseCase,
      GetPendingKycUseCase,
      KycInfrastructureModule
   ]
})
export class KycModule {}
