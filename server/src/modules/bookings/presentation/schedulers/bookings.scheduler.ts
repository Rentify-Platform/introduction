import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../../../prisma/prisma.service'
import { booking_status } from '@prisma/client'
import { PAYMENT_TIMEOUT_SECONDS } from '../../bookings.constants'
import { BookedDatesCachePort } from '../../application/ports/booked-dates-cache.port'
import { ExpireApprovalBookingUseCase, ExpireApprovalBookingCommand } from '../../application/use-cases/expire-approval-booking.usecase'

@Injectable()
export class BookingsScheduler {
   private readonly logger = new Logger(BookingsScheduler.name)

   constructor(
      private readonly prisma: PrismaService,
      private readonly bookedDatesCachePort: BookedDatesCachePort,
      private readonly expireApprovalBookingUseCase: ExpireApprovalBookingUseCase
   ) {}

   // Run hourly to check and complete bookings that have passed checkout time
   @Cron(CronExpression.EVERY_HOUR)
   async handleBookingCheckoutScan() {
      this.logger.log('Starting cron job to scan and complete past bookings...')

      // 1.   Get the current time
      const now = new Date()

      try {
         // 2.   Update all bookings with 'confirmed' status and checkout date before current time
         const updateResult = await this.prisma.bookings.updateMany({
            where: {
               status: booking_status.confirmed,
               check_out: {
                  lt: now
               }
            },
            data: {
               status: booking_status.completed,
               updated_at: now
            }
         })

         // 3.   Log results if records were updated
         if (updateResult.count > 0) {
            this.logger.log(
               `Successfully updated ${updateResult.count} booking(s) to COMPLETED status.`
            )
         } else {
            this.logger.log('No confirmed bookings found that require checkout completion.')
         }
      } catch (error) {
         // 4.   Handle and log error if any
         this.logger.error('Failed to complete past bookings via scheduler:', error)
      }
   }

   // Scan pending bookings that have timed out on payment and change their status to 'expired'
   @Cron(CronExpression.EVERY_MINUTE)
   async handlePendingBookingTimeoutScan() {
      this.logger.log('Starting cron job to scan and expire pending bookings...')

      // 1.   Get the current time and calculate the expired timeout threshold
      const now = new Date()
      const timeoutThreshold = new Date(now.getTime() - PAYMENT_TIMEOUT_SECONDS * 1000)

      try {
         // 2.   Find list of expired bookings to retrieve property_id for invalidating cache
         const expiredBookings = await this.prisma.bookings.findMany({
            where: {
               status: booking_status.pending,
               created_at: {
                  lt: timeoutThreshold
               }
            },
            select: {
               id: true,
               property_id: true
            }
         })

         if (expiredBookings.length > 0) {
            // 3.   Update status to 'expired' in database
            await this.prisma.bookings.updateMany({
               where: {
                  id: {
                     in: expiredBookings.map((b) => b.id)
                  }
               },
               data: {
                  status: booking_status.expired,
                  updated_at: now
               }
            })

            this.logger.log(
               `Expired ${expiredBookings.length} pending booking(s) due to payment timeout.`
            )

            // 4.   Invalidate booked dates cache of affected properties to reload empty calendar
            const propertyIds = Array.from(new Set(expiredBookings.map((b) => b.property_id)))
            for (const pid of propertyIds) {
               await this.bookedDatesCachePort.invalidate(pid)
               this.logger.log(`Invalidated booked dates cache for property: ${pid}`)
            }
         }
      } catch (error) {
         // 5.   Handle and log error if any
         this.logger.error('Failed to expire pending bookings via scheduler:', error)
      }
   }

   // Scan pending approval bookings that have gone 24 hours without host approval and expire/refund them
   @Cron(CronExpression.EVERY_5_MINUTES)
   async handleApprovalTimeoutScan() {
      this.logger.log('Starting cron job to scan and expire unapproved booking requests...')

      // 1.   Calculate the 24-hour expiration threshold
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000)

      try {
         // 2.   Find list of unapproved bookings that have timed out
         const timedOutBookings = await this.prisma.bookings.findMany({
            where: {
               status: booking_status.pending_approval,
               updated_at: {
                  lt: threshold
               }
            },
            select: {
               id: true
            }
         })

         if (timedOutBookings.length > 0) {
            this.logger.log(`Found ${timedOutBookings.length} booking request(s) awaiting approval that have timed out.`)

            // 3.   Expire each booking request one by one using the usecase
            for (const b of timedOutBookings) {
               try {
                  const command = new ExpireApprovalBookingCommand(b.id)
                  await this.expireApprovalBookingUseCase.execute(command)
                  this.logger.log(`Successfully expired booking request: ${b.id}`)
               } catch (err) {
                  this.logger.error(`Failed to expire booking request ${b.id}:`, err)
               }
            }
         }
      } catch (error) {
         // 4.   Handle and log error if scan fails
         this.logger.error('Failed to scan for unapproved booking request timeouts:', error)
      }
   }
}
