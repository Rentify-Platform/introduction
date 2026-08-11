import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ListingsModule } from '../listings/listings.module'
import { BookingsInfrastructureModule } from './infrastructure/bookings.infrastructure.module'
import { BookingsController } from './presentation/controllers/bookings.controller'
import { CreateBookingUseCase } from './application/use-cases/create-booking.usecase'
import { GetBookingDetailsUseCase } from './application/use-cases/get-booking-details.usecase'
import { ConfirmSepayPaymentUseCase } from './application/use-cases/confirm-sepay-payment.usecase'
import { GetGuestBookingsUseCase } from './application/use-cases/get-guest-bookings.usecase'
import { CancelBookingUseCase } from './application/use-cases/cancel-booking.usecase'
import { GetBookedDatesUseCase } from './application/use-cases/get-booked-dates.usecase'
import { GetHostBookingsUseCase } from './application/use-cases/get-host-bookings.usecase'
import { ApproveBookingUseCase } from './application/use-cases/approve-booking.usecase'
import { DeclineBookingUseCase } from './application/use-cases/decline-booking.usecase'
import { ExpireApprovalBookingUseCase } from './application/use-cases/expire-approval-booking.usecase'
import { LedgerModule } from '../ledger/ledger.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { BookingsScheduler } from './presentation/schedulers/bookings.scheduler'
import { RedisModule } from '../../shared/redis/redis.module'

@Module({
   imports: [
      BookingsInfrastructureModule,
      AuthModule,
      ListingsModule,
      LedgerModule,
      PrismaModule,
      RedisModule
   ],
   controllers: [BookingsController],
   providers: [
      CreateBookingUseCase,
      GetBookingDetailsUseCase,
      ConfirmSepayPaymentUseCase,
      GetGuestBookingsUseCase,
      CancelBookingUseCase,
      GetBookedDatesUseCase,
      GetHostBookingsUseCase,
      ApproveBookingUseCase,
      DeclineBookingUseCase,
      ExpireApprovalBookingUseCase,
      BookingsScheduler
   ],
   exports: [
      CreateBookingUseCase,
      GetBookingDetailsUseCase,
      ConfirmSepayPaymentUseCase,
      GetGuestBookingsUseCase,
      CancelBookingUseCase,
      GetBookedDatesUseCase,
      GetHostBookingsUseCase,
      ApproveBookingUseCase,
      DeclineBookingUseCase,
      ExpireApprovalBookingUseCase,
      BookingsInfrastructureModule
   ]
 })
 export class BookingsModule {}
