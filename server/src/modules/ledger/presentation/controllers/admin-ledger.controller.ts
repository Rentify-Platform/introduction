import { Controller, Get, Patch, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
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
import { ApiResponse } from '../../../../shared/response/api-response'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'

@ApiTags('Admin - Ledger')
@ApiBearerAuth('bearer')
@Controller('admin/ledger')
export class AdminLedgerController {
   constructor(
      private readonly listAllTransactionsUseCase: ListAllTransactionsUseCase,
      private readonly listAllBalancesUseCase: ListAllBalancesUseCase,
      private readonly listAllPayoutsUseCase: ListAllPayoutsUseCase,
      private readonly getPlatformConfigUseCase: GetPlatformConfigUseCase,
      private readonly updatePlatformConfigUseCase: UpdatePlatformConfigUseCase
   ) {}

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
      const parsedFrom = dateFrom ? new Date(dateFrom) : undefined
      const parsedTo = dateTo ? new Date(dateTo) : undefined
      const command = new ListAllTransactionsCommand(
         type,
         bookingId,
         parsedFrom && !isNaN(parsedFrom.getTime()) ? parsedFrom : undefined,
         parsedTo && !isNaN(parsedTo.getTime()) ? parsedTo : undefined,
         page ? parseInt(page, 10) : 1,
         limit ? parseInt(limit, 10) : 20
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
      const parsedFrom = scheduledForFrom ? new Date(scheduledForFrom) : undefined
      const parsedTo = scheduledForTo ? new Date(scheduledForTo) : undefined
      const command = new ListAllPayoutsCommand(
         hostId,
         status,
         parsedFrom && !isNaN(parsedFrom.getTime()) ? parsedFrom : undefined,
         parsedTo && !isNaN(parsedTo.getTime()) ? parsedTo : undefined,
         page ? parseInt(page, 10) : 1,
         limit ? parseInt(limit, 10) : 20
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
