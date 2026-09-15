import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
   GetBalanceActor,
   GetBalanceCommand,
   GetBalanceUseCase
} from '../../application/use-cases/get-balance.usecase'
import { GetBalanceQueryRequest } from '../requests/get-balance-query.request'
import { LedgerMapper } from '../mappers/ledger.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { CurrentUser, AuthenticatedUser } from '../../../auth/presentation/current-user.decorator'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'

@ApiTags('Ledger')
@ApiBearerAuth('bearer')
@Controller('ledger')
export class LedgerController {
   constructor(private readonly getBalanceUseCase: GetBalanceUseCase) {}

   @Get('accounts/balance')
   @UseGuards(JwtAuthGuard)
   @ApiOperation({ summary: "Get the caller's own ledger account balance" })
   async getBalance(
      @CurrentUser() user: AuthenticatedUser,
      @Query() query: GetBalanceQueryRequest
   ) {
      const command = new GetBalanceCommand(
         query.ledgerAccountId || null,
         (query.ownerType as LedgerOwnerType) || null,
         query.ownerAccountId || null,
         query.accountSubtype || null,
         query.currency || null,
         GetBalanceActor.fromAuthenticatedUser(user)
      )
      const balance = await this.getBalanceUseCase.execute(command)
      return ApiResponse.success(
         LedgerMapper.toBalanceResponse(balance),
         'Balance retrieved successfully'
      )
   }
}
