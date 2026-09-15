import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../../../ledger/application/use-cases/post-transaction.usecase'

export interface AdminOverrideCancellationCommand {
   bookingId: string
   adminId: string
   overrideReason: string
   guestRefundCents: number
   hostPayoutCents: number
   platformFeeKeptCents: number
}

export interface AdminOverrideCancellationAmounts {
   guestRefundCents: bigint
   hostPayoutCents: bigint
   platformFeeKeptCents: bigint
}

export class AdminOverrideCancellationResult {
   constructor(
      public readonly previous: AdminOverrideCancellationAmounts,
      public readonly next: AdminOverrideCancellationAmounts,
      public readonly deltas: AdminOverrideCancellationAmounts,
      // Null when the override changed nothing or no refund ledger transaction
      // ever existed for this cancellation (no captured payment), in which case
      // the override is recorded for reporting only.
      public readonly ledgerTransactionId: string | null
   ) {}
}

@Injectable()
export class AdminOverrideCancellationUseCase {
   constructor(
      private readonly prisma: PrismaService,
      private readonly postTransactionUseCase: PostTransactionUseCase
   ) {}

   async execute(
      command: AdminOverrideCancellationCommand
   ): Promise<AdminOverrideCancellationResult> {
      // 1. Validate booking exists and is cancelled
      const booking = await this.prisma.bookings.findUnique({
         where: { id: command.bookingId },
         include: { cancellations: true }
      })

      if (!booking) {
         throw new NotFoundException(`Booking ${command.bookingId} not found`)
      }

      if (
         booking.status !== 'cancelled_by_guest' &&
         booking.status !== 'cancelled_by_host' &&
         booking.status !== 'cancelled_by_admin'
      ) {
         throw new BadRequestException('Cannot override cancellation for a non-cancelled booking')
      }

      const cancellation = booking.cancellations[0]
      if (!cancellation) {
         throw new BadRequestException('Cancellation record missing for this booking')
      }

      // 2. Validate the requested amounts (DTO already enforces non-negative,
      //    but the use case must stay safe if called from elsewhere).
      const next: AdminOverrideCancellationAmounts = {
         guestRefundCents: BigInt(Math.round(command.guestRefundCents)),
         hostPayoutCents: BigInt(Math.round(command.hostPayoutCents)),
         platformFeeKeptCents: BigInt(Math.round(command.platformFeeKeptCents))
      }

      if (
         next.guestRefundCents < 0n ||
         next.hostPayoutCents < 0n ||
         next.platformFeeKeptCents < 0n
      ) {
         throw new BadRequestException('Override amounts must not be negative')
      }

      if (
         next.guestRefundCents + next.hostPayoutCents + next.platformFeeKeptCents !==
         booking.total_price_cents
      ) {
         throw new BadRequestException(
            'Override amounts must sum to the booking total price ' +
               `(${booking.total_price_cents.toString()} cents)`
         )
      }

      // 3. Read the current values and compute the per-party deltas
      const previous: AdminOverrideCancellationAmounts = {
         guestRefundCents: cancellation.guest_refund_cents,
         hostPayoutCents: cancellation.host_payout_cents,
         platformFeeKeptCents: cancellation.platform_fee_kept_cents
      }

      const deltas: AdminOverrideCancellationAmounts = {
         guestRefundCents: next.guestRefundCents - previous.guestRefundCents,
         hostPayoutCents: next.hostPayoutCents - previous.hostPayoutCents,
         platformFeeKeptCents: next.platformFeeKeptCents - previous.platformFeeKeptCents
      }

      // 4-5. Post a balanced ledger adjustment transaction and update the
      //    cancellation record inside ONE Prisma interactive transaction, so a
      //    failure in either step rolls back both and the report can never
      //    diverge from the ledger (plan step 8). The deterministic idempotency
      //    key remains as a second line of defense against duplicate submits.
      //    The original refund transaction is immutable, so the override is
      //    reconciled via deltas. Only post when money actually moved before (a
      //    refund transaction exists, i.e. the booking had a captured payment);
      //    otherwise the override is a report-only change and creating ledger
      //    entries would mint balances backed by no received money.
      const hasRefundTransaction = cancellation.ledger_transaction_id !== null
      const hasDelta =
         deltas.guestRefundCents !== 0n ||
         deltas.hostPayoutCents !== 0n ||
         deltas.platformFeeKeptCents !== 0n

      const entries: PostTransactionEntryCommand[] = []
      let idempotencyKey: string | null = null

      if (hasDelta && hasRefundTransaction) {
         const currency = booking.currency.toUpperCase()

         if (deltas.guestRefundCents !== 0n) {
            entries.push(
               new PostTransactionEntryCommand(
                  null,
                  'guest',
                  booking.guest_id,
                  'clearing',
                  deltas.guestRefundCents,
                  currency
               )
            )
         }

         if (deltas.hostPayoutCents !== 0n) {
            entries.push(
               new PostTransactionEntryCommand(
                  null,
                  'host',
                  booking.host_id,
                  'payable',
                  deltas.hostPayoutCents,
                  currency
               )
            )
         }

         if (deltas.platformFeeKeptCents !== 0n) {
            entries.push(
               new PostTransactionEntryCommand(
                  null,
                  'platform',
                  null,
                  'clearing',
                  deltas.platformFeeKeptCents,
                  currency
               )
            )
         }

         // Escrow absorbs any drift between the previous amounts and the booking
         // total (e.g. a clamped platform fee at cancellation time). For the
         // common case (previous amounts already summed to the total) it is zero
         // and skipped, keeping the adjustment strictly between the three parties.
         const escrowDelta = -(
            deltas.guestRefundCents +
            deltas.hostPayoutCents +
            deltas.platformFeeKeptCents
         )
         if (escrowDelta !== 0n) {
            entries.push(
               new PostTransactionEntryCommand(
                  null,
                  'platform',
                  null,
                  'escrow',
                  escrowDelta,
                  currency
               )
            )
         }

         // Deterministic idempotency key: replaying the same override amounts
         // can never mint a second adjustment transaction, and a retry reuses
         // the existing transaction instead of duplicating it.
         idempotencyKey =
            `cancellation-override-${cancellation.id}` +
            `-g${next.guestRefundCents}-h${next.hostPayoutCents}-p${next.platformFeeKeptCents}`
      }

      const ledgerTransactionId = await this.prisma.$transaction(async (tx) => {
         let txnId: string | null = null

         if (idempotencyKey) {
            const adjustment = await this.postTransactionUseCase.execute(
               new PostTransactionCommand(
                  idempotencyKey,
                  'adjustment',
                  booking.id,
                  `Cancellation override adjustment for booking ${booking.id}`,
                  {
                     cancellationId: cancellation.id,
                     overrideReason: command.overrideReason,
                     previous: {
                        guestRefundCents: previous.guestRefundCents.toString(),
                        hostPayoutCents: previous.hostPayoutCents.toString(),
                        platformFeeKeptCents: previous.platformFeeKeptCents.toString()
                     },
                     next: {
                        guestRefundCents: next.guestRefundCents.toString(),
                        hostPayoutCents: next.hostPayoutCents.toString(),
                        platformFeeKeptCents: next.platformFeeKeptCents.toString()
                     }
                  },
                  command.adminId,
                  entries
               ),
               tx
            )
            txnId = adjustment.id
         }

         // Update the cancellation record with the new amounts plus the audit
         // trail (previous amounts, admin, reason, adjustment transaction id).
         // When no new adjustment is posted, the reference to the latest
         // adjustment transaction is kept instead of being wiped to null.
         await tx.cancellations.update({
            where: { id: cancellation.id },
            data: {
               guest_refund_cents: next.guestRefundCents,
               host_payout_cents: next.hostPayoutCents,
               platform_fee_kept_cents: next.platformFeeKeptCents,
               override_reason: command.overrideReason,
               override_by_admin_id: command.adminId,
               override_previous_guest_refund_cents: previous.guestRefundCents,
               override_previous_host_payout_cents: previous.hostPayoutCents,
               override_previous_platform_fee_kept_cents: previous.platformFeeKeptCents,
               ...(txnId !== null ? { override_ledger_transaction_id: txnId } : {})
            }
         })

         return txnId
      })

      return new AdminOverrideCancellationResult(previous, next, deltas, ledgerTransactionId)
   }
}
