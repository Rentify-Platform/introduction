'use client'

import { Button } from '@/components/ui/button'
import { Listing } from '@/features/listings/types'
import { Calendar, CheckCircle2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Booking } from '../types'
import { formatPrice } from '@/lib/format/price'
import { formatDate } from '@/lib/format/date'

interface CheckoutSuccessViewProps {
   booking: Booking
   property: Listing | undefined
}

export function CheckoutSuccessView({ booking, property }: CheckoutSuccessViewProps) {
   const router = useRouter()
   const payment = booking.payment
   const amount = payment ? Number(payment.amountCents) / 100 : 0

   return (
      <div className="border-zinc-150 mx-auto max-w-lg rounded-3xl border bg-zinc-50 p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40">
         <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
         </div>
         <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Booking Confirmed!
         </h1>
         <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            We received your payment of{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
               {formatPrice(amount, booking.currency)}
            </strong>
            . Your reservation has been finalized and locked in.
         </p>

         <div className="mt-8 space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-left dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 dark:border-zinc-800">
               <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  Reservation Code
               </span>
               <span className="rounded bg-zinc-200 px-2.5 py-1 font-mono text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {booking.id.split('-')[0].toUpperCase()}
               </span>
            </div>

            <div className="flex items-center justify-between text-sm">
               <span className="text-zinc-550 flex items-center gap-2 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" /> Check-in
               </span>
               <span className="font-bold">{formatDate(booking.checkIn)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
               <span className="text-zinc-555 flex items-center gap-2 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" /> Checkout
               </span>
               <span className="font-bold">{formatDate(booking.checkOut)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
               <span className="text-zinc-555 flex items-center gap-2 dark:text-zinc-400">
                  <Users className="h-4 w-4" /> Guests
               </span>
               <span className="font-bold">{booking.guestsCount} guests</span>
            </div>

            {property && (
               <div className="border-t border-zinc-200/50 pt-4 dark:border-zinc-800">
                  <span className="block text-xs font-bold text-zinc-400 uppercase">Property</span>
                  <span className="mt-1 block font-bold text-zinc-900 dark:text-zinc-100">
                     {property.title}
                  </span>
                  <span className="text-xs text-zinc-400">
                     {property.addressLine1}, {property.city}
                  </span>
               </div>
            )}
         </div>

         <Button
            onClick={() => router.push('/')}
            className="mt-8 h-12 w-full rounded-xl bg-zinc-900 font-bold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
         >
            Explore More Homes
         </Button>
      </div>
   )
}
