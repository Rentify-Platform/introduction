import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { ManageHostPenaltiesUseCase } from '../../application/use-cases/manage-host-penalties.usecase'
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePenaltyRequest {
   @ApiProperty({ example: 'uuid' })
   @IsString()
   @IsNotEmpty()
   hostId: string

   @ApiPropertyOptional({ example: 'uuid' })
   @IsString()
   @IsOptional()
   bookingId?: string

   @ApiProperty({ example: 'host_cancellation' })
   @IsString()
   @IsNotEmpty()
   penaltyType: string

   @ApiProperty({ example: 500000 })
   @IsNumber()
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
      const p = page ? parseInt(page, 10) : 1
      const l = limit ? parseInt(limit, 10) : 20
      const result = await this.manageHostPenaltiesUseCase.listPenalties(hostId, p, l)

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

   @Delete(':id')
   @Authorize('admin')
   @ApiOperation({ summary: 'Delete a host penalty (Admin only)' })
   @ApiParam({ name: 'id', type: String })
   async delete(@Param('id') id: string) {
      await this.manageHostPenaltiesUseCase.deletePenalty(id)
      return ApiResponse.success(null, 'Penalty deleted successfully')
   }
}
