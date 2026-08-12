import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   SubmitGuestKycUseCase,
   SubmitKycCommand
} from '../../application/use-cases/submit-guest-kyc.usecase'
import { KycDocType } from '../../domain/entities/kyc-document.entity'
import { KycMapper } from '../mappers/kyc.mapper'
import { SubmitKycRequest } from '../requests/submit-kyc.request'

@ApiTags('KYC')
@ApiBearerAuth('bearer')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class GuestKycController {
   constructor(private readonly submitGuestKycUseCase: SubmitGuestKycUseCase) {}

   @Post('submit')
   @ApiOperation({ summary: 'Submit KYC document for verification' })
   async submitKyc(@CurrentUser() user: AuthenticatedUser, @Body() request: SubmitKycRequest) {
      const command = new SubmitKycCommand(
         user.id,
         request.docType as KycDocType,
         request.countryCode || null,
         request.documentNumber || null,
         request.fileUrlFront,
         request.fileUrlBack || null,
         request.issueDate ? new Date(request.issueDate) : null,
         request.expiryDate ? new Date(request.expiryDate) : null
      )

      const result = await this.submitGuestKycUseCase.execute(command)

      return ApiResponse.success(
         KycMapper.toSubmitResponse(result),
         'KYC document submitted and processed successfully'
      )
   }
}
