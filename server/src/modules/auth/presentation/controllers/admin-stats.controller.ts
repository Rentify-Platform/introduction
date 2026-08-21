import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { GetAdminStatsUseCase } from '../../application/use-cases/get-admin-stats.usecase'

@ApiTags('Admin - Stats')
@ApiBearerAuth('bearer')
@Controller('admin/stats')
export class AdminStatsController {
   constructor(private readonly getAdminStatsUseCase: GetAdminStatsUseCase) {}

   @Get('overview')
   @Authorize('admin')
   @ApiOperation({ summary: 'Get admin dashboard overview statistics' })
   async getOverview() {
      return await this.getAdminStatsUseCase.executeOverview()
   }

   @Get('recent-bookings')
   @Authorize('admin')
   @ApiOperation({ summary: 'Get 10 most recent bookings' })
   async getRecentBookings() {
      return await this.getAdminStatsUseCase.executeRecentBookings()
   }
}
