import { Injectable } from '@nestjs/common'
import { BookingLockPort } from '../../application/ports/booking-lock.port'
import { RedisService } from '../../../../shared/redis/redis.service'

@Injectable()
export class BookingRedisLockProvider implements BookingLockPort {
   constructor(private readonly redisService: RedisService) {}

   private generateDateKeys(propertyId: string, checkIn: Date, checkOut: Date): string[] {
      const keys: string[] = []
      const current = new Date(checkIn)
      const end = new Date(checkOut)

      // Normalize dates to midnight to avoid timezone shift/hour mismatch issues
      current.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      while (current < end) {
         const yyyy = current.getFullYear()
         const mm = String(current.getMonth() + 1).padStart(2, '0')
         const dd = String(current.getDate()).padStart(2, '0')
         keys.push(`lock:property:${propertyId}:${yyyy}-${mm}-${dd}`)

         current.setDate(current.getDate() + 1)
      }

      return keys
   }

   async acquireLock(
      propertyId: string,
      checkIn: Date,
      checkOut: Date,
      bookingId: string,
      ttlSeconds: number
   ): Promise<boolean> {
      const keys = this.generateDateKeys(propertyId, checkIn, checkOut)
      return this.redisService.acquireMultiLock(keys, bookingId, ttlSeconds)
   }

   async releaseLock(propertyId: string, checkIn: Date, checkOut: Date): Promise<void> {
      const keys = this.generateDateKeys(propertyId, checkIn, checkOut)
      await this.redisService.delMany(keys)
   }
}
