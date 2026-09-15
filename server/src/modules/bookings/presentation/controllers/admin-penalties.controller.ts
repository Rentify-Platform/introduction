import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import {
   HOST_PENALTY_TYPES,
   ManageHostPenaltiesUseCase
} from '../../application/use-cases/manage-host-penalties.usecase'
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { parseAdminPagination } from '../../../../shared/query/admin-query-parser'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'

export class VoidPenaltyRequest {
   @ApiProperty({ example: 'Penalty was created in error' })
   @IsString()
   @IsNotEmpty()
   reason: string
}

export class CreatePenaltyRequest {
   @ApiProperty({ example: 'uuid' })
   @IsString()
   @IsNotEmpty()
   hostId: string

   @ApiPropertyOptional({ example: 'uuid' })
   @IsString()
   @IsOptional()
   bookingId?: string

   @ApiProperty({ example: 'host_cancellation', enum: HOST_PENALTY_TYPES })
   @IsString()
   @IsNotEmpty()
   @IsIn(HOST_PENALTY_TYPES)
   penaltyType: string

   @ApiProperty({ example: 500000, type: Number })
   @IsNumber({ allowNaN: false, allowInfinity: false })
   @IsInt()
   @Min(0)
   amountCents: number

   @ApiPropertyOptional({ example: 'Cancelled 2 hours before check-in' })
   @IsString()
   @IsOptional()
   notes?: string
}

@ApiTags('Admin - Penalties')
@ApiBearerAuth('bearer')
@Controller('admin/penalties')
export class AdminPenaltiesController {
   constructor(private readonly manageHostPenaltiesUseCase: ManageHostPenaltiesUseCase) {}

   @Get()
   @Authorize('admin')
   @ApiOperation({ summary: 'List all host penalties (Admin only)' })
   @ApiQuery({ name: 'hostId', required: false, type: String })
   @ApiQuery({ name: 'page', required: false, type: Number })
   @ApiQuery({ name: 'limit', required: false, type: Number })
   async list(
      @Query('hostId') hostId?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const pagination = parseAdminPagination(page, limit)
      const result = await this.manageHostPenaltiesUseCase.listPenalties(
         hostId,
         pagination.page,
         pagination.limit
      )

      const formatted = result.data.map((item) => ({
         id: item.id,
         hostId: item.host_id,
         hostName: item.accounts?.profiles
            ? `${item.accounts.profiles.first_name} ${item.accounts.profiles.last_name}`.trim()
            : 'Unknown',
         hostEmail: item.accounts?.email,
         bookingId: item.booking_id,
         penaltyType: item.penalty_type,
         amountCents: item.amount_cents.toString(),
         notes: item.notes,
         status: item.status,
         voidedAt: item.voided_at?.toISOString() ?? null,
         voidReason: item.void_reason,
         voidedByAdminId: item.voided_by_admin_id,
         createdAt: item.created_at.toISOString()
      }))

      return ApiResponse.success(
         {
            data: formatted,
            total: result.total,
            page: result.page,
            limit: result.limit
         },
         'Penalties retrieved successfully'
      )
   }

   @Post()
   @Authorize('admin')
   @ApiOperation({ summary: 'Create a new host penalty (Admin only)' })
   async create(@Body() request: CreatePenaltyRequest) {
      const penalty = await this.manageHostPenaltiesUseCase.createPenalty(request)
      return ApiResponse.success(
         {
            id: penalty.id,
            amountCents: penalty.amount_cents.toString()
         },
         'Penalty created successfully'
      )
   }

   @Post(':id/void')
   @Authorize('admin')
   @ApiOperation({ summary: 'Void a host penalty with an audit reason (Admin only)' })
   @ApiParam({ name: 'id', type: String })
   async voidPenalty(
      @Param('id') id: string,
      @Body() request: VoidPenaltyRequest,
      @CurrentUser() user: AuthenticatedUser
   ) {
      const penalty = await this.manageHostPenaltiesUseCase.voidPenalty({
         penaltyId: id,
         adminId: user.id,
         reason: request.reason
      })
      return ApiResponse.success(
         { id: penalty.id, status: penalty.status, voidedAt: penalty.voided_at?.toISOString() },
         'Penalty voided successfully'
      )
   }
}
