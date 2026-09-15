import { Module } from '@nestjs/common'
import { AuthInfrastructureModule } from './infrastructure/auth.infrastructure.module'
import { AuthController } from './presentation/controllers/auth.controller'
import { AdminAccountsController } from './presentation/controllers/admin-accounts.controller'
import { SignupUseCase } from './application/use-cases/signup.usecase'
import { LoginUseCase } from './application/use-cases/login.usecase'
import { GetMeUseCase } from './application/use-cases/get-me.usecase'
import { UpdateProfileUseCase } from './application/use-cases/update-profile.usecase'
import { ListAccountsUseCase } from './application/use-cases/list-accounts.usecase'
import { UpdateAccountStatusUseCase } from './application/use-cases/update-account-status.usecase'
import { GetAdminStatsUseCase } from './application/use-cases/get-admin-stats.usecase'
import { AdminStatsController } from './presentation/controllers/admin-stats.controller'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
   imports: [AuthInfrastructureModule, PrismaModule],
   controllers: [AuthController, AdminAccountsController, AdminStatsController],
   providers: [
      SignupUseCase,
      LoginUseCase,
      GetMeUseCase,
      UpdateProfileUseCase,
      ListAccountsUseCase,
      UpdateAccountStatusUseCase,
      GetAdminStatsUseCase
   ],
   exports: [
      SignupUseCase,
      LoginUseCase,
      GetMeUseCase,
      UpdateProfileUseCase,
      AuthInfrastructureModule
   ]
})
export class AuthModule {}
