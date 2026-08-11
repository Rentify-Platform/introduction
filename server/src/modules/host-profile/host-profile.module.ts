import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { KycModule } from '../kyc/kyc.module'
import { HostProfileInfrastructureModule } from './infrastructure/host-profile.infrastructure.module'
import { HostProfileController } from './presentation/controllers/host-profile.controller'
import { BecomeHostUseCase } from './application/use-cases/become-host.usecase'
import { GetHostProfileUseCase } from './application/use-cases/get-host-profile.usecase'
import { RegisterHostUseCase } from './application/use-cases/register-host.usecase'
import { SetupHostPayoutUseCase } from './application/use-cases/setup-payout.usecase'
import { SubmitHostTaxInfoUseCase } from './application/use-cases/submit-tax-info.usecase'
import { UpdateAboutUseCase } from './application/use-cases/update-about.usecase'

@Module({
   imports: [HostProfileInfrastructureModule, AuthModule, KycModule],
   controllers: [HostProfileController],
   providers: [
      BecomeHostUseCase,
      GetHostProfileUseCase,
      RegisterHostUseCase,
      SetupHostPayoutUseCase,
      SubmitHostTaxInfoUseCase,
      UpdateAboutUseCase
   ],
   exports: [
      BecomeHostUseCase,
      GetHostProfileUseCase,
      RegisterHostUseCase,
      SetupHostPayoutUseCase,
      SubmitHostTaxInfoUseCase,
      UpdateAboutUseCase,
      HostProfileInfrastructureModule
   ]
})
export class HostProfileModule {}
