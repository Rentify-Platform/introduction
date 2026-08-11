'use client'

import { Booking } from '../types'

interface CancellationPolicySectionProps {
   booking: Booking
}

export function CancellationPolicySection({ booking }: CancellationPolicySectionProps) {
   return (
      <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
         <h2 className="text-xl font-bold">Cancellation policy</h2>
         <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {booking.cancellationPolicyCode === 'flexible'
               ? 'Flexible: Free cancellation up to 24 hours before check-in. Cancellations within 24 hours are non-refundable.'
               : 'Moderate: Free cancellation up to 5 days before check-in. Cancellations after that will receive a 50% refund.'}
         </p>
      </section>
   )
}
