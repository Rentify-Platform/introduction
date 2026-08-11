import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { RedisModule } from '../../../shared/redis/redis.module'
import { BookingsRepository } from '../domain/repositories/bookings.repository'
import { BookingsPrismaRepository } from './persistence/bookings.prisma.repository'
import { BookingLockPort } from '../application/ports/booking-lock.port'
import { BookingRedisLockProvider } from './providers/booking-redis-lock.provider'
import { BookedDatesCachePort } from '../application/ports/booked-dates-cache.port'
import { BookingRedisCacheProvider } from './providers/booking-redis-cache.provider'
import { PaymentGatewayPort } from '../application/ports/payment-gateway.port'
import { SepayPaymentGateway } from './providers/sepay-payment-gateway.provider'

@Module({
   imports: [PrismaModule, RedisModule],
   providers: [
      {
         provide: BookingsRepository,
         useClass: BookingsPrismaRepository
      },
      {
         provide: BookingLockPort,
         useClass: BookingRedisLockProvider
      },
      {
         provide: BookedDatesCachePort,
         useClass: BookingRedisCacheProvider
      },
      {
         provide: PaymentGatewayPort,
         useClass: SepayPaymentGateway
      }
   ],
   exports: [BookingsRepository, BookingLockPort, BookedDatesCachePort, PaymentGatewayPort]
})
export class BookingsInfrastructureModule {}
