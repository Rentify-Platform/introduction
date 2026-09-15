import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { PrismaService } from '../../../../prisma/prisma.service'
import { ToggleSuperhostUseCase } from '../../application/use-cases/toggle-superhost.usecase'
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import { parseAdminPagination } from '../../../../shared/query/admin-query-parser'

export class ToggleSuperhostRequest {
   @ApiProperty({ example: true })
   @IsBoolean()
   isSuperhost: boolean

   @ApiProperty({ example: 'Host met all superhost requirements' })
   @IsString()
   @IsNotEmpty()
   reason: string
}

@ApiTags('Admin - Hosts')
@ApiBearerAuth('bearer')
@Controller('admin/hosts')
export class AdminHostsController {
   constructor(
      private readonly toggleSuperhostUseCase: ToggleSuperhostUseCase,
      private readonly prisma: PrismaService
   ) {}

   @Get()
   @Authorize('admin')
   @ApiOperation({ summary: 'List host profiles (Admin only)' })
   @ApiQuery({ name: 'page', required: false, type: Number })
   @ApiQuery({ name: 'limit', required: false, type: Number })
   async list(@Query('page') page?: string, @Query('limit') limit?: string) {
      const pagination = parseAdminPagination(page, limit)
      const skip = (pagination.page - 1) * pagination.limit

      const [data, total] = await Promise.all([
         this.prisma.host_profiles.findMany({
            skip,
            take: pagination.limit,
            orderBy: { created_at: 'desc' },
            include: {
               accounts: {
                  select: {
                     email: true,
                     profiles: { select: { first_name: true, last_name: true } }
                  }
               }
            }
         }),
         this.prisma.host_profiles.count()
      ])

      const formatted = data.map((host) => ({
         accountId: host.account_id,
         name: host.accounts?.profiles
            ? `${host.accounts.profiles.first_name} ${host.accounts.profiles.last_name}`.trim()
            : 'Unknown',
         email: host.accounts?.email,
         isSuperhost: host.is_superhost,
         responseRatePct: host.response_rate_pct,
         kycStatus: host.kyc_status,
         createdAt: host.created_at.toISOString()
      }))

      return ApiResponse.success(
         {
            data: formatted,
            total,
            page: pagination.page,
            limit: pagination.limit
         },
         'Hosts retrieved successfully'
      )
   }

   @Patch(':accountId/superhost')
   @Authorize('admin')
   @ApiOperation({ summary: 'Toggle superhost status (Admin only)' })
   @ApiParam({ name: 'accountId', type: String })
   async toggleSuperhost(
      @Param('accountId') accountId: string,
      @Body() request: ToggleSuperhostRequest,
      @CurrentUser() user: AuthenticatedUser
   ) {
      await this.toggleSuperhostUseCase.execute({
         accountId,
         isSuperhost: request.isSuperhost,
         adminId: user.id,
         reason: request.reason
      })
      return ApiResponse.success(
         null,
         `Superhost status updated successfully to ${request.isSuperhost}`
      )
   }
}
