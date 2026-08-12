import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import {
   ListAccountsUseCase,
   ListAccountsCommand
} from '../../application/use-cases/list-accounts.usecase'
import {
   UpdateAccountStatusUseCase,
   UpdateAccountStatusCommand
} from '../../application/use-cases/update-account-status.usecase'
import { UpdateAccountStatusRequest } from '../requests/update-account-status.request'
import { AdminAccountMapper } from '../mappers/admin-account.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'

@ApiTags('Admin - Accounts')
@ApiBearerAuth('bearer')
@Controller('admin/accounts')
export class AdminAccountsController {
   constructor(
      private readonly listAccountsUseCase: ListAccountsUseCase,
      private readonly updateAccountStatusUseCase: UpdateAccountStatusUseCase
   ) {}

   @Get()
   @Authorize('admin')
   @ApiOperation({ summary: 'List user accounts with pagination and filtering (Admin only)' })
   @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term by email or name' })
   @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role (guest, host, admin)' })
   @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status (active, suspended, banned)' })
   @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
   @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20)' })
   async listAccounts(
      @Query('search') search?: string,
      @Query('role') role?: string,
      @Query('status') status?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const command = new ListAccountsCommand(
         search,
         role,
         status,
         page ? parseInt(page, 10) : 1,
         limit ? parseInt(limit, 10) : 20
      )

      const result = await this.listAccountsUseCase.execute(command)
      return ApiResponse.success(
         AdminAccountMapper.toPaginatedResponse(result),
         'Accounts retrieved successfully'
      )
   }

   @Patch(':accountId/status')
   @Authorize('admin')
   @ApiOperation({ summary: 'Update account status (active, suspended, banned) (Admin only)' })
   @ApiParam({ name: 'accountId', type: String, description: 'Account UUID' })
   async updateAccountStatus(
      @Param('accountId') accountId: string,
      @Body() request: UpdateAccountStatusRequest
   ) {
      const command = new UpdateAccountStatusCommand(accountId, request.status)
      const result = await this.updateAccountStatusUseCase.execute(command)
      return ApiResponse.success(
         AdminAccountMapper.toAccountSummary(result),
         `Account status updated to '${request.status}' successfully`
      )
   }
}
