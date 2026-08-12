import { Controller, Post, Get, Body, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ReviewKycUseCase, ReviewKycCommand } from '../../application/use-cases/review-kyc.usecase'
import {
   RescreenKycUseCase,
   RescreenKycCommand
} from '../../application/use-cases/rescreen-kyc.usecase'
import { GetPendingKycUseCase } from '../../application/use-cases/get-pending-kyc.usecase'
import { ReviewKycRequest } from '../requests/review-kyc.request'
import { KycMapper } from '../mappers/kyc.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { CurrentUser, AuthenticatedUser } from '../../../auth/presentation/current-user.decorator'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'

@ApiTags('Admin - KYC')
@ApiBearerAuth('bearer')
@Controller('admin/kyc')
export class AdminKycController {
   constructor(
      private readonly reviewKycUseCase: ReviewKycUseCase,
      private readonly rescreenKycUseCase: RescreenKycUseCase,
      private readonly getPendingKycUseCase: GetPendingKycUseCase
   ) {}

   @Get('pending')
   @Authorize('admin')
   @ApiOperation({ summary: 'Get list of pending KYC document submissions (Admin only)' })
   async getPendingKyc() {
      const documents = await this.getPendingKycUseCase.execute()
      return ApiResponse.success(
         documents.map((doc) => KycMapper.toDocumentResponse(doc)),
         'Pending KYC documents retrieved successfully'
      )
   }

   @Post('review/:documentId')
   @Authorize('admin')
   @ApiOperation({ summary: 'Review (approve or reject) a KYC document (Admin only)' })
   @ApiParam({ name: 'documentId', type: String, description: 'KYC Document UUID' })
   async reviewKyc(
      @CurrentUser() user: AuthenticatedUser,
      @Param('documentId') documentId: string,
      @Body() request: ReviewKycRequest
   ) {
      const command = new ReviewKycCommand(
         documentId,
         user.id,
         request.action,
         request.rejectionReason || null
      )

      const result = await this.reviewKycUseCase.execute(command)

      return ApiResponse.success(
         KycMapper.toReviewResponse(result),
         `KYC document has been successfully ${request.action}ed`
      )
   }

   @Post('rescreen')
   @Authorize('admin')
   @ApiOperation({ summary: 'Trigger rescreening for expiring KYC background checks (Admin only)' })
   async rescreenExpiringChecks(@CurrentUser() user: AuthenticatedUser) {
      const command = new RescreenKycCommand()
      const result = await this.rescreenKycUseCase.execute(command)

      return ApiResponse.success(
         KycMapper.toRescreenResponse(result),
         'Expiring KYC background checks rescreening completed'
      )
   }
}
