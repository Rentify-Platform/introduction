'use client'

import { Booking } from '../types'

import { formatDate } from '@/lib/format/date'

interface TripDetailsSectionProps {
   booking: Booking
}

export function TripDetailsSection({ booking }: TripDetailsSectionProps) {
   return (
      <section className="space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
         <h2 className="text-xl font-bold">Your trip</h2>

         <div className="flex items-start justify-between">
            <div>
               <span className="block font-bold">Dates</span>
               <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
               </span>
            </div>
         </div>

         <div className="flex items-start justify-between">
            <div>
               <span className="block font-bold">Guests</span>
               <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {booking.guestsCount} guest{booking.guestsCount > 1 ? 's' : ''}
               </span>
            </div>
         </div>
      </section>
   )
}
