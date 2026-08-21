import {
   Body,
   Controller,
   Get,
   Headers,
   HttpCode,
   HttpStatus,
   Param,
   Post,
   Req,
   UnauthorizedException,
   ForbiddenException,
   UseGuards
} from '@nestjs/common'
import {
   ApiBearerAuth,
   ApiHeader,
   ApiOperation,
   ApiParam,
   ApiSecurity,
   ApiTags
} from '@nestjs/swagger'
import { createHmac, timingSafeEqual } from 'crypto'
import { Authorize } from 'src/shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   ConfirmSepayPaymentCommand,
   ConfirmSepayPaymentUseCase
} from '../../application/use-cases/confirm-sepay-payment.usecase'
import {
   CreateBookingCommand,
   CreateBookingUseCase
} from '../../application/use-cases/create-booking.usecase'
import {
   GetBookingDetailsCommand,
   GetBookingDetailsUseCase
} from '../../application/use-cases/get-booking-details.usecase'
import {
   GetGuestBookingsCommand,
   GetGuestBookingsUseCase
} from '../../application/use-cases/get-guest-bookings.usecase'
import {
   CancelBookingCommand,
   CancelBookingUseCase
} from '../../application/use-cases/cancel-booking.usecase'
import {
   GetBookedDatesQuery,
   GetBookedDatesUseCase
} from '../../application/use-cases/get-booked-dates.usecase'
import {
   GetHostBookingsUseCase,
   GetHostBookingsCommand
} from '../../application/use-cases/get-host-bookings.usecase'
import {
   ApproveBookingUseCase,
   ApproveBookingCommand
} from '../../application/use-cases/approve-booking.usecase'
import {
   DeclineBookingUseCase,
   DeclineBookingCommand
} from '../../application/use-cases/decline-booking.usecase'
import { Public } from '../../../../shared/decorators/public.decorator'
import { BookingsMapper } from '../mappers/bookings.mapper'
import { CreateBookingRequest } from '../requests/create-booking.request'
import { CancelBookingRequest } from '../requests/cancel-booking.request'

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
   constructor(
      private readonly createBookingUseCase: CreateBookingUseCase,
      private readonly getBookingDetailsUseCase: GetBookingDetailsUseCase,
      private readonly confirmSepayPaymentUseCase: ConfirmSepayPaymentUseCase,
      private readonly getGuestBookingsUseCase: GetGuestBookingsUseCase,
      private readonly cancelBookingUseCase: CancelBookingUseCase,
      private readonly getBookedDatesUseCase: GetBookedDatesUseCase,
      private readonly getHostBookingsUseCase: GetHostBookingsUseCase,
      private readonly approveBookingUseCase: ApproveBookingUseCase,
      private readonly declineBookingUseCase: DeclineBookingUseCase
   ) {}

   @Get('guest')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Get current guest booking history' })
   async getGuestBookings(@CurrentUser() user: AuthenticatedUser) {
      const command = new GetGuestBookingsCommand(user.id)
      const results = await this.getGuestBookingsUseCase.execute(command)
      return ApiResponse.success(
         results.map((r) => BookingsMapper.toBookingResponse(r.booking, r.payment, r.property)),
         'Guest bookings retrieved successfully'
      )
   }

   @Post()
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Create a new property reservation request' })
   async create(@CurrentUser() user: AuthenticatedUser, @Body() request: CreateBookingRequest) {
      const command = new CreateBookingCommand(
         request.propertyId,
         user.id,
         request.checkIn,
         request.checkOut,
         request.guestsCount
      )
      const result = await this.createBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result.booking, result.payment),
         'Booking created successfully. Please complete payment.'
      )
   }

   @Get(':id')
   @Authorize()
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Get booking details by ID' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async getDetails(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new GetBookingDetailsCommand(id, user.id, user.role)
      const result = await this.getBookingDetailsUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result.booking, result.payment, result.property),
         'Booking details retrieved successfully'
      )
   }

   @Get('property/:propertyId/booked-dates')
   @Public()
   @ApiOperation({ summary: 'Get reserved/booked dates for a property' })
   @ApiParam({ name: 'propertyId', type: String, description: 'Property UUID' })
   async getBookedDates(@Param('propertyId') propertyId: string) {
      const query = new GetBookedDatesQuery(propertyId)
      const dates = await this.getBookedDatesUseCase.execute(query)
      return ApiResponse.success(dates, 'Booked dates retrieved successfully')
   }

   @Post('sepay-webhook')
   @HttpCode(HttpStatus.OK)
   @ApiSecurity('sepay-api-key')
   @ApiOperation({ summary: 'Handle SePay payment webhook notification' })
   @ApiHeader({ name: 'x-api-key', required: false, description: 'SePay API key token' })
   @ApiHeader({ name: 'x-sepay-signature', required: false, description: 'SePay HMAC signature' })
   @ApiHeader({ name: 'x-sepay-timestamp', required: false, description: 'SePay timestamp header' })
   async handleSepayWebhook(
      @Body() body: any,
      @Req() req: any,
      @Headers('x-api-key') apiKey?: string,
      @Headers('authorization') authHeader?: string,
      @Headers('x-sepay-signature') sepaySignature?: string,
      @Headers('x-sepay-timestamp') sepayTimestamp?: string
   ) {
      console.log('[Sepay Webhook Received]', body)

      const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN
      if (!expectedToken) {
         throw new UnauthorizedException('Sepay Webhook Token is not configured on the server')
      }

      // 1. If SePay HMAC-SHA256 signature is provided, verify it
      if (sepaySignature && sepayTimestamp) {
         const rawBody = req.rawBody ? req.rawBody.toString('utf8') : ''
         const dataToVerify = sepayTimestamp + '.' + rawBody

         const hmac = createHmac('sha256', expectedToken)
         hmac.update(dataToVerify)
         const expectedSignature = hmac.digest('hex')

         const actualHash = sepaySignature.startsWith('sha256=')
            ? sepaySignature.substring(7)
            : sepaySignature

         const bufferActual = Buffer.from(actualHash, 'hex')
         const bufferExpected = Buffer.from(expectedSignature, 'hex')

         if (
            bufferActual.length !== bufferExpected.length ||
            !timingSafeEqual(bufferActual, bufferExpected)
         ) {
            throw new UnauthorizedException('Invalid Sepay HMAC Signature')
         }
      }
      // 2. Otherwise fall back to API Key verification
      else {
         let providedKey = apiKey
         if (authHeader && authHeader.startsWith('Apikey ')) {
            providedKey = authHeader.substring(7)
         }

         if (providedKey !== expectedToken) {
            throw new UnauthorizedException('Invalid Sepay API Key')
         }
      }

      const transferAmount = Number(body.transferAmount || body.amount || 0)
      let transactionContent = body.transactionContent || body.content || ''

      // If SePay VA sends the order code directly in the 'code' field, use it
      if (body.code && body.code.toUpperCase().startsWith('RENTIFY')) {
         transactionContent = body.code
      }

      const gateway = body.gateway || 'Unknown'
      const transactionDate = body.transactionDate || ''
      const referenceNumber = body.referenceNumber || ''

      const command = new ConfirmSepayPaymentCommand(
         transferAmount,
         transactionContent,
         gateway,
         transactionDate,
         referenceNumber
      )

      const result = await this.confirmSepayPaymentUseCase.execute(command)
      return result
   }

   @Post(':id/cancel')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Cancel a booking' })
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

   @Get('host')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Get host property bookings (Host/Admin only)' })
   async getHostBookings(@CurrentUser() user: AuthenticatedUser) {
      if (user.role !== 'host' && user.role !== 'admin') {
         throw new ForbiddenException('Only hosts or admins can access host bookings')
      }
      const command = new GetHostBookingsCommand(user.id)
      const results = await this.getHostBookingsUseCase.execute(command)
      return ApiResponse.success(
         results.map((r) => BookingsMapper.toBookingResponse(r.booking, r.payment, r.property)),
         'Host bookings retrieved successfully'
      )
   }

   @Post(':id/approve')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Approve a booking request (Host/Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      if (user.role !== 'host' && user.role !== 'admin') {
         throw new ForbiddenException('Only hosts or admins can approve bookings')
      }
      const command = new ApproveBookingCommand(id, user.id)
      const result = await this.approveBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result, null),
         'Booking request approved successfully'
      )
   }

   @Post(':id/decline')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Decline a booking request (Host/Admin only)' })
   @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
   async decline(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: { reason?: string }
   ) {
      if (user.role !== 'host' && user.role !== 'admin') {
         throw new ForbiddenException('Only hosts or admins can decline bookings')
      }
      const command = new DeclineBookingCommand(id, user.id, request.reason || null)
      const result = await this.declineBookingUseCase.execute(command)
      return ApiResponse.success(
         BookingsMapper.toBookingResponse(result, null),
         'Booking request declined successfully'
      )
   }
}
