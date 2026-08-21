import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { PrismaService } from '../../../../prisma/prisma.service'
import { ToggleSuperhostUseCase } from '../../application/use-cases/toggle-superhost.usecase'
import { IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ToggleSuperhostRequest {
   @ApiProperty({ example: true })
   @IsBoolean()
   isSuperhost: boolean
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
      const p = page ? parseInt(page, 10) : 1
      const l = limit ? parseInt(limit, 10) : 20
      const skip = (p - 1) * l

      const [data, total] = await Promise.all([
         this.prisma.host_profiles.findMany({
            skip,
            take: l,
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
            page: p,
            limit: l
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
      @Body() request: ToggleSuperhostRequest
   ) {
      await this.toggleSuperhostUseCase.execute({
         accountId,
         isSuperhost: request.isSuperhost
      })
      return ApiResponse.success(
         null,
         `Superhost status updated successfully to ${request.isSuperhost}`
      )
   }
}
