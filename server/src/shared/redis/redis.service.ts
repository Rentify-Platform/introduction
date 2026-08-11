import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
   private readonly logger = new Logger(RedisService.name)
   private client: Redis

   onModuleInit() {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.logger.log(`Connecting to Redis at ${redisUrl}`)
      this.client = new Redis(redisUrl)

      this.client.on('error', (err) => {
         this.logger.error('Redis client error:', err)
      })
   }

   onModuleDestroy() {
      if (this.client) {
         this.client.disconnect()
      }
   }

   async get(key: string): Promise<string | null> {
      return this.client.get(key)
   }

   async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      if (ttlSeconds) {
         await this.client.setex(key, ttlSeconds, value)
      } else {
         await this.client.set(key, value)
      }
   }

   async del(key: string): Promise<void> {
      await this.client.del(key)
   }

   async delMany(keys: string[]): Promise<void> {
      if (keys.length === 0) return
      await this.client.del(...keys)
   }

   async exists(key: string): Promise<boolean> {
      const result = await this.client.exists(key)
      return result === 1
   }

   async smembers(key: string): Promise<string[]> {
      return this.client.smembers(key)
   }

   async sadd(key: string, members: string | string[]): Promise<void> {
      if (Array.isArray(members)) {
         if (members.length > 0) {
            await this.client.sadd(key, ...members)
         }
      } else {
         await this.client.sadd(key, members)
      }
   }

   async expire(key: string, seconds: number): Promise<void> {
      await this.client.expire(key, seconds)
   }

   /**
    * Acquires locks on multiple keys atomically using a Lua script.
    * If any key is already locked, it returns false and no locks are acquired.
    * @param keys The keys to lock
    * @param value The value to set (e.g. bookingId)
    * @param ttlSeconds TTL for the lock
    */
   async acquireMultiLock(keys: string[], value: string, ttlSeconds: number): Promise<boolean> {
      if (keys.length === 0) return true

      const luaScript = `
         for i, key in ipairs(KEYS) do
            local exists = redis.call('EXISTS', key)
            if exists == 1 then
               return 0
            end
         end
         for i, key in ipairs(KEYS) do
            redis.call('SETEX', key, ARGV[2], ARGV[1])
         end
         return 1
      `

      const result = await this.client.eval(
         luaScript,
         keys.length,
         ...keys,
         value,
         ttlSeconds.toString()
      )

      return result === 1
   }
}
