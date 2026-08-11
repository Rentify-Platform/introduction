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

@Module({
   imports: [AuthInfrastructureModule],
   controllers: [AuthController, AdminAccountsController],
   providers: [
      SignupUseCase,
      LoginUseCase,
      GetMeUseCase,
      UpdateProfileUseCase,
      ListAccountsUseCase,
      UpdateAccountStatusUseCase
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
