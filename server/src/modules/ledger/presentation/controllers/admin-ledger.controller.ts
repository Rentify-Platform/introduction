import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import {
   GetBalanceActor,
   GetBalanceCommand,
   GetBalanceUseCase
} from '../../application/use-cases/get-balance.usecase'
import {
   ListAllTransactionsUseCase,
   ListAllTransactionsCommand
} from '../../application/use-cases/list-all-transactions.usecase'
import { ListAllBalancesUseCase } from '../../application/use-cases/list-all-balances.usecase'
import {
   ListAllPayoutsUseCase,
   ListAllPayoutsCommand
} from '../../application/use-cases/list-all-payouts.usecase'
import { GetPlatformConfigUseCase } from '../../application/use-cases/get-platform-config.usecase'
import {
   UpdatePlatformConfigUseCase,
   UpdatePlatformConfigCommand
} from '../../application/use-cases/update-platform-config.usecase'
import { UpdatePlatformConfigRequest } from '../requests/update-platform-config.request'
import { AdminLedgerMapper } from '../mappers/admin-ledger.mapper'
import { LedgerMapper } from '../mappers/ledger.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { CurrentUser, AuthenticatedUser } from '../../../auth/presentation/current-user.decorator'
import {
   parseAdminPagination,
   parseOptionalAdminDate,
   validateAdminDateRange
} from '../../../../shared/query/admin-query-parser'

@ApiTags('Admin - Ledger')
@ApiBearerAuth('bearer')
@Controller('admin/ledger')
export class AdminLedgerController {
   constructor(
      private readonly getBalanceUseCase: GetBalanceUseCase,
      private readonly listAllTransactionsUseCase: ListAllTransactionsUseCase,
      private readonly listAllBalancesUseCase: ListAllBalancesUseCase,
      private readonly listAllPayoutsUseCase: ListAllPayoutsUseCase,
      private readonly getPlatformConfigUseCase: GetPlatformConfigUseCase,
      private readonly updatePlatformConfigUseCase: UpdatePlatformConfigUseCase
   ) {}

   @Get('platform-balance')
   @UseGuards(JwtAuthGuard)
   @Authorize('admin')
   @ApiOperation({ summary: 'Get the Rentify platform revenue balance in VND' })
   async getPlatformBalance(@CurrentUser() user: AuthenticatedUser) {
      const balance = await this.getBalanceUseCase.execute(
         new GetBalanceCommand(
            null,
            'platform',
            null,
            'revenue',
            'VND',
            GetBalanceActor.fromAuthenticatedUser(user)
         )
      )

      return ApiResponse.success(
         { ...LedgerMapper.toBalanceResponse(balance), currency: 'VND' },
         'Platform balance retrieved successfully'
      )
   }

   @Get('transactions')
   @Authorize('admin')
   @ApiOperation({ summary: 'List all ledger transactions with filters (Admin only)' })
   @ApiQuery({
      name: 'type',
      required: false,
      type: String,
      description: 'Filter by transaction type'
   })
   @ApiQuery({
      name: 'bookingId',
      required: false,
      type: String,
      description: 'Filter by Booking UUID'
   })
   @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date (from)' })
   @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date (to)' })
   @ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default 1)'
   })
   @ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default 20)'
   })
   async listTransactions(
      @Query('type') type?: string,
      @Query('bookingId') bookingId?: string,
      @Query('dateFrom') dateFrom?: string,
      @Query('dateTo') dateTo?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const parsedFrom = parseOptionalAdminDate(dateFrom, 'dateFrom')
      const parsedTo = parseOptionalAdminDate(dateTo, 'dateTo')
      validateAdminDateRange(parsedFrom, parsedTo, 'dateFrom', 'dateTo')
      const pagination = parseAdminPagination(page, limit)
      const command = new ListAllTransactionsCommand(
         type,
         bookingId,
         parsedFrom,
         parsedTo,
         pagination.page,
         pagination.limit
      )

      const result = await this.listAllTransactionsUseCase.execute(command)
      return ApiResponse.success(
         AdminLedgerMapper.toPaginatedTransactionsResponse(result),
         'Transactions retrieved successfully'
      )
   }

   @Get('balances')
   @Authorize('admin')
   @ApiOperation({ summary: 'List all ledger account balances (Admin only)' })
   async listBalances() {
      const result = await this.listAllBalancesUseCase.execute()
      return ApiResponse.success(
         result.map((balance) => AdminLedgerMapper.toBalanceWithAccountResponse(balance)),
         'Balances retrieved successfully'
      )
   }

   @Get('payouts')
   @Authorize('admin')
   @ApiOperation({ summary: 'List all host payouts with filters (Admin only)' })
   @ApiQuery({
      name: 'hostId',
      required: false,
      type: String,
      description: 'Filter by Host UUID'
   })
   @ApiQuery({
      name: 'status',
      required: false,
      type: String,
      description: 'Filter by payout status (pending, processing, paid, failed)'
   })
   @ApiQuery({
      name: 'scheduledForFrom',
      required: false,
      type: String,
      description: 'ISO date — scheduled from'
   })
   @ApiQuery({
      name: 'scheduledForTo',
      required: false,
      type: String,
      description: 'ISO date — scheduled to'
   })
   @ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default 1)'
   })
   @ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default 20)'
   })
   async listPayouts(
      @Query('hostId') hostId?: string,
      @Query('status') status?: string,
      @Query('scheduledForFrom') scheduledForFrom?: string,
      @Query('scheduledForTo') scheduledForTo?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const parsedFrom = parseOptionalAdminDate(scheduledForFrom, 'scheduledForFrom')
      const parsedTo = parseOptionalAdminDate(scheduledForTo, 'scheduledForTo')
      validateAdminDateRange(parsedFrom, parsedTo, 'scheduledForFrom', 'scheduledForTo')
      const pagination = parseAdminPagination(page, limit)
      const command = new ListAllPayoutsCommand(
         hostId,
         status,
         parsedFrom,
         parsedTo,
         pagination.page,
         pagination.limit
      )

      const result = await this.listAllPayoutsUseCase.execute(command)
      return ApiResponse.success(
         AdminLedgerMapper.toPaginatedPayoutsResponse(result),
         'Payouts retrieved successfully'
      )
   }

   @Get('config')
   @Authorize('admin')
   @ApiOperation({ summary: 'Get platform configuration (fee rules) (Admin only)' })
   async getPlatformConfig() {
      const config = await this.getPlatformConfigUseCase.execute()
      return ApiResponse.success(
         {
            feeRules: config.feeRules,
            updatedAt: config.updatedAt.toISOString()
         },
         'Platform config retrieved successfully'
      )
   }

   @Patch('config')
   @Authorize('admin')
   @ApiOperation({ summary: 'Update platform configuration fee rules (Admin only)' })
   async updatePlatformConfig(@Body() request: UpdatePlatformConfigRequest) {
      const command = new UpdatePlatformConfigCommand(request.feeRules)
      const config = await this.updatePlatformConfigUseCase.execute(command)
      return ApiResponse.success(
         {
            feeRules: config.feeRules,
            updatedAt: config.updatedAt.toISOString()
         },
         'Platform config updated successfully'
      )
   }
}
