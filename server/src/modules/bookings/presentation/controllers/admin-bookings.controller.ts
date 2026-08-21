import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   ListAllBookingsUseCase,
   ListAllBookingsCommand
} from '../../application/use-cases/list-all-bookings.usecase'
import {
   GetBookingDetailsUseCase,
   GetBookingDetailsCommand
} from '../../application/use-cases/get-booking-details.usecase'
import {
   ApproveBookingUseCase,
   ApproveBookingCommand
} from '../../application/use-cases/approve-booking.usecase'
import {
   DeclineBookingUseCase,
   DeclineBookingCommand
} from '../../application/use-cases/decline-booking.usecase'
import {
   CancelBookingUseCase,
   CancelBookingCommand
} from '../../application/use-cases/cancel-booking.usecase'
import { BookingsMapper } from '../mappers/bookings.mapper'
import { CancelBookingRequest } from '../requests/cancel-booking.request'

@ApiTags('Admin - Bookings')
@ApiBearerAuth('bearer')
@Controller('admin/bookings')
export class AdminBookingsController {
   constructor(
      private readonly listAllBookingsUseCase: ListAllBookingsUseCase,
      private readonly getBookingDetailsUseCase: GetBookingDetailsUseCase,
      private readonly approveBookingUseCase: ApproveBookingUseCase,
      private readonly declineBookingUseCase: DeclineBookingUseCase,
      private readonly cancelBookingUseCase: CancelBookingUseCase
   ) {}

   @Get()
   @Authorize('admin')
   @ApiOperation({ summary: 'List all bookings with filters (Admin only)' })
   @ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search by guest/host name or email, or property title'
   })
   @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
   @ApiQuery({
      name: 'guestId',
      required: false,
      type: String,
      description: 'Filter by Guest UUID'
   })
   @ApiQuery({ name: 'hostId', required: false, type: String, description: 'Filter by Host UUID' })
   @ApiQuery({
      name: 'propertyId',
      required: false,
      type: String,
      description: 'Filter by Property UUID'
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
   async listBookings(
      @Query('search') search?: string,
      @Query('status') status?: string,
      @Query('guestId') guestId?: string,
      @Query('hostId') hostId?: string,
      @Query('propertyId') propertyId?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const command = new ListAllBookingsCommand(
         search,
         status,
         guestId,
         hostId,
         propertyId,
         page ? parseInt(page, 10) : 1,
         limit ? parseInt(limit, 10) : 20
      )

      const result = await this.listAllBookingsUseCase.execute(command)

      const formatPerson = (
         person: { firstName: string; lastName: string; email: string } | null
      ) => {
         if (!person) return { name: null as string | null, email: null as string | null }
         const fullName = `${person.firstName} ${person.lastName}`.trim()
         return { name: fullName || null, email: person.email }
      }

      const items = result.data.map((item) => {
         const guest = formatPerson(item.guest)
         const host = formatPerson(item.host)
         return {
            ...BookingsMapper.toBookingResponse(item.booking, item.payment),
            createdAt: item.booking.createdAt.toISOString(),
            guestName: guest.name,
            guestEmail: guest.email,
            hostName: host.name,
            hostEmail: host.email,
            propertyTitle: item.property ? item.property.title : null,
            propertyCity: item.property ? item.property.city : null
         }
      })

      return ApiResponse.success(
         {
            data: items,
            total: result.total,
            page: result.page,
            limit: result.limit
         },
         'Bookings retrieved successfully'
      )
   }

   @Get(':id')
   @Authorize('admin')
   @ApiOperation({ summary: 'Get booking details by ID (Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async getDetails(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new GetBookingDetailsCommand(id, user.id, user.role)
      const result = await this.getBookingDetailsUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result.booking, result.payment, result.property),
         'Booking details retrieved successfully'
      )
   }

   @Post(':id/approve')
   @Authorize('admin')
   @ApiOperation({ summary: 'Approve a booking request (Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new ApproveBookingCommand(id, user.id, 'admin')
      const result = await this.approveBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result, null),
         'Booking request approved successfully'
      )
   }

   @Post(':id/decline')
   @Authorize('admin')
   @ApiOperation({ summary: 'Decline a booking request (Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async decline(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: { reason?: string }
   ) {
      const command = new DeclineBookingCommand(id, user.id, request.reason || null, 'admin')
      const result = await this.declineBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result, null),
         'Booking request declined successfully'
      )
   }

   @Post(':id/cancel')
   @Authorize('admin')
   @ApiOperation({ summary: 'Cancel a booking (Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async cancel(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: CancelBookingRequest
   ) {
      const command = new CancelBookingCommand(id, user.id, user.role, request.reason || null)
      const { booking, payment } = await this.cancelBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(booking, payment),
         'Booking cancelled successfully'
      )
   }
}
