import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   BecomeHostCommand,
   BecomeHostUseCase
} from '../../application/use-cases/become-host.usecase'
import {
   GetHostProfileCommand,
   GetHostProfileUseCase
} from '../../application/use-cases/get-host-profile.usecase'
import {
   RegisterHostCommand,
   RegisterHostIdentityInput,
   RegisterHostUseCase
} from '../../application/use-cases/register-host.usecase'
import {
   SetupPayoutCommand,
   SetupHostPayoutUseCase
} from '../../application/use-cases/setup-payout.usecase'
import {
   SubmitTaxInfoCommand,
   SubmitHostTaxInfoUseCase
} from '../../application/use-cases/submit-tax-info.usecase'
import {
   UpdateAboutCommand,
   UpdateAboutUseCase
} from '../../application/use-cases/update-about.usecase'
import { HostProfileMapper } from '../mappers/host-profile.mapper'
import { RegisterHostRequest } from '../requests/register-host.request'
import { SetupPayoutRequest } from '../requests/setup-payout.request'
import { SubmitTaxInfoRequest } from '../requests/submit-tax-info.request'
import { UpdateAboutRequest } from '../requests/update-about.request'

@ApiTags('Host Profile')
@ApiBearerAuth('bearer')
@Controller('hosts')
@UseGuards(JwtAuthGuard)
export class HostProfileController {
   constructor(
      private readonly becomeHostUseCase: BecomeHostUseCase,
      private readonly getHostProfileUseCase: GetHostProfileUseCase,
      private readonly registerHostUseCase: RegisterHostUseCase,
      private readonly setupHostPayoutUseCase: SetupHostPayoutUseCase,
      private readonly submitHostTaxInfoUseCase: SubmitHostTaxInfoUseCase,
      private readonly updateAboutUseCase: UpdateAboutUseCase
   ) {}

   @Post('become')
   @ApiOperation({ summary: 'Register the logged-in user as a host' })
   async becomeHost(@CurrentUser() user: AuthenticatedUser) {
      const command = new BecomeHostCommand(user.id)
      const result = await this.becomeHostUseCase.execute(command)
      return ApiResponse.success(result, 'Successfully registered as a host')
   }

   @Post('register')
   @ApiOperation({ summary: 'Complete full host onboarding registration (Identity, Tax, Payout)' })
   async registerHost(
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: RegisterHostRequest
   ) {
      const identity = request.identity
         ? new RegisterHostIdentityInput(
              request.identity.docType as any,
              request.identity.countryCode ?? null,
              request.identity.documentNumber ?? null,
              request.identity.fileUrlFront,
              request.identity.fileUrlBack ?? null,
              request.identity.issueDate ? new Date(request.identity.issueDate) : null,
              request.identity.expiryDate ? new Date(request.identity.expiryDate) : null
           )
         : null

      const command = new RegisterHostCommand(
         user.id,
         identity,
         request.taxCountry,
         request.taxId,
         request.taxFormType,
         request.payoutProvider,
         request.payoutAccountId
      )
      const result = await this.registerHostUseCase.execute(command)
      return ApiResponse.success(result, 'Host registration completed successfully')
   }

   @Get('profile')
   @ApiOperation({ summary: 'Get current host profile details' })
   async getProfile(@CurrentUser() user: AuthenticatedUser) {
      const command = new GetHostProfileCommand(user.id)
      const profile = await this.getHostProfileUseCase.execute(command)
      return ApiResponse.success(
         HostProfileMapper.toResponse(profile),
         'Host profile retrieved successfully'
      )
   }

   @Post('tax-info')
   @ApiOperation({ summary: 'Submit host tax identification information' })
   async submitTaxInfo(
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: SubmitTaxInfoRequest
   ) {
      const command = new SubmitTaxInfoCommand(
         user.id,
         request.taxCountry,
         request.taxId,
         request.taxFormType
      )
      const result = await this.submitHostTaxInfoUseCase.execute(command)
      return ApiResponse.success(result, 'Tax information submitted and verified successfully')
   }

   @Post('payout')
   @ApiOperation({ summary: 'Setup host payout account' })
   async setupPayout(@CurrentUser() user: AuthenticatedUser, @Body() request: SetupPayoutRequest) {
      const command = new SetupPayoutCommand(
         user.id,
         request.payoutProvider,
         request.payoutAccountId
      )
      const result = await this.setupHostPayoutUseCase.execute(command)
      return ApiResponse.success(result, 'Payout bank account linked and verified successfully')
   }

   @Patch('profile/about')
   @ApiOperation({ summary: 'Update host bio/about section' })
   async updateAbout(@CurrentUser() user: AuthenticatedUser, @Body() request: UpdateAboutRequest) {
      const command = new UpdateAboutCommand(user.id, request.about)
      const profile = await this.updateAboutUseCase.execute(command)
      return ApiResponse.success(
         HostProfileMapper.toResponse(profile),
         'Host bio/description updated successfully'
      )
   }
}
