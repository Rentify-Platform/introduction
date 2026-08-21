import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
   GetBalanceCommand,
   GetBalanceUseCase
} from '../../application/use-cases/get-balance.usecase'
import { LedgerMapper } from '../mappers/ledger.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'

@ApiTags('Admin Ledger')
@ApiBearerAuth('bearer')
@Controller('admin/ledger')
export class AdminLedgerController {
   constructor(private readonly getBalanceUseCase: GetBalanceUseCase) {}

   @Get('platform-balance')
   @UseGuards(JwtAuthGuard)
   @Authorize('admin')
   @ApiOperation({ summary: 'Get the Rentify platform revenue balance in VND' })
   async getPlatformBalance() {
      const balance = await this.getBalanceUseCase.execute(
         new GetBalanceCommand(null, 'platform', null, 'revenue', 'VND')
      )

      return ApiResponse.success(
         { ...LedgerMapper.toBalanceResponse(balance), currency: 'VND' },
         'Platform balance retrieved successfully'
      )
   }
}
