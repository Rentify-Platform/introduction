import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export interface AdminOverrideCancellationCommand {
   bookingId: string
   adminId: string
   overrideReason: string
   guestRefundCents: number
   hostPayoutCents: number
   platformFeeKeptCents: number
}

@Injectable()
export class AdminOverrideCancellationUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async execute(command: AdminOverrideCancellationCommand): Promise<void> {
      // 1. Validate booking exists and is cancelled
      const booking = await this.prisma.bookings.findUnique({
         where: { id: command.bookingId },
         include: { cancellations: true }
      })

      if (!booking) {
         throw new NotFoundException(`Booking ${command.bookingId} not found`)
      }

      if (booking.status !== 'cancelled_by_guest' && booking.status !== 'cancelled_by_host') {
         throw new BadRequestException(
            'Cannot override cancellation for a non-cancelled booking'
         )
      }

      const cancellation = booking.cancellations[0]
      if (!cancellation) {
         throw new BadRequestException(
            'Cancellation record missing for this booking'
         )
      }

      // 2. Update cancellation record
      await this.prisma.cancellations.update({
         where: { id: cancellation.id },
         data: {
            override_reason: command.overrideReason,
            override_by_admin_id: command.adminId,
            guest_refund_cents: command.guestRefundCents,
            host_payout_cents: command.hostPayoutCents,
            platform_fee_kept_cents: command.platformFeeKeptCents
         }
      })

      // Note: We do not trigger a ledger transaction here per plan.
      // Ledger records should be adjusted manually if needed.
   }
}
