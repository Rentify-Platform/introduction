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
import { ToggleSuperhostUseCase } from './application/use-cases/toggle-superhost.usecase'
import { AdminHostsController } from './presentation/controllers/admin-hosts.controller'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
   imports: [HostProfileInfrastructureModule, AuthModule, KycModule, PrismaModule],
   controllers: [HostProfileController, AdminHostsController],
   providers: [
      BecomeHostUseCase,
      GetHostProfileUseCase,
      RegisterHostUseCase,
      SetupHostPayoutUseCase,
      SubmitHostTaxInfoUseCase,
      UpdateAboutUseCase,
      ToggleSuperhostUseCase
   ],
   exports: [
      BecomeHostUseCase,
      GetHostProfileUseCase,
      RegisterHostUseCase,
      SetupHostPayoutUseCase,
      SubmitHostTaxInfoUseCase,
      UpdateAboutUseCase,
      ToggleSuperhostUseCase,
      HostProfileInfrastructureModule
   ]
})
export class HostProfileModule {}
