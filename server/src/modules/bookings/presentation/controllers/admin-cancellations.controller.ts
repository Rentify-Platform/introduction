import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { ListCancellationsUseCase } from '../../application/use-cases/list-cancellations.usecase'

@ApiTags('Admin - Cancellations')
@ApiBearerAuth('bearer')
@Controller('admin/cancellations')
export class AdminCancellationsController {
   constructor(private readonly listCancellationsUseCase: ListCancellationsUseCase) {}

   @Get()
   @Authorize('admin')
   @ApiOperation({ summary: 'List all cancellations (Admin only)' })
   @ApiQuery({ name: 'page', required: false, type: Number })
   @ApiQuery({ name: 'limit', required: false, type: Number })
   @ApiQuery({ name: 'propertyId', required: false, type: String })
   async list(
      @Query('page') page?: string,
      @Query('limit') limit?: string,
      @Query('propertyId') propertyId?: string
   ) {
      const p = page ? parseInt(page, 10) : 1
      const l = limit ? parseInt(limit, 10) : 20
      const result = await this.listCancellationsUseCase.execute(p, l, propertyId)

      const formatted = result.data.map((item) => {
         const booking = item.bookings
         const guestProfile = booking?.accounts_bookings_guest_idToaccounts?.profiles
         const hostProfile = booking?.accounts_bookings_host_idToaccounts?.profiles

         return {
            id: item.id,
            bookingId: item.booking_id,
            propertyTitle: booking?.properties?.title,
            guestName: guestProfile
               ? `${guestProfile.first_name} ${guestProfile.last_name}`.trim()
               : 'Unknown',
            hostName: hostProfile
               ? `${hostProfile.first_name} ${hostProfile.last_name}`.trim()
               : 'Unknown',
            reason: item.reason_text,
            guestRefundCents: item.guest_refund_cents?.toString(),
            hostPayoutCents: item.host_payout_cents?.toString(),
            platformFeeKeptCents: item.platform_fee_kept_cents?.toString(),
            overrideReason: item.override_reason,
            overrideByAdminId: item.override_by_admin_id,
            createdAt: item.created_at.toISOString()
         }
      })

      return ApiResponse.success(
         {
            data: formatted,
            total: result.total,
            page: result.page,
            limit: result.limit
         },
         'Cancellations retrieved successfully'
      )
   }
}
