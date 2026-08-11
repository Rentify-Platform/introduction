import { Injectable } from '@nestjs/common'
import { BookedDatesCachePort } from '../../application/ports/booked-dates-cache.port'
import { RedisService } from '../../../../shared/redis/redis.service'

@Injectable()
export class BookingRedisCacheProvider implements BookedDatesCachePort {
   constructor(private readonly redisService: RedisService) {}

   private getCacheKey(propertyId: string): string {
      return `booked_dates:property:${propertyId}`
   }

   async getBookedDates(propertyId: string): Promise<string[] | null> {
      const key = this.getCacheKey(propertyId)
      const exists = await this.redisService.exists(key)
      if (!exists) {
         return null
      }
      const members = await this.redisService.smembers(key)
      // Filter out the "EMPTY" dummy value used to prevent cache penetration
      return members.filter((m) => m !== 'EMPTY')
   }

   async setBookedDates(propertyId: string, dates: string[]): Promise<void> {
      const key = this.getCacheKey(propertyId)
      await this.redisService.del(key) // Ensure clean state
      if (dates.length > 0) {
         await this.redisService.sadd(key, dates)
      } else {
         // Prevent cache penetration by caching an empty marker
         await this.redisService.sadd(key, 'EMPTY')
      }
      await this.redisService.expire(key, 86400) // 24 hours TTL
   }

   async invalidate(propertyId: string): Promise<void> {
      const key = this.getCacheKey(propertyId)
      await this.redisService.del(key)
   }
}
