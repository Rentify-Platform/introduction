import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { BookingsManagementContainer } from './components/bookings-management-container'

export const metadata = {
   title: 'Booking Management — Rentify Admin',
   description: 'View, filter and manage all platform bookings'
}

export default function BookingsManagementPage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <CalendarDays className="h-8 w-8 text-pink-500" />
               Booking Management
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
               View, approve, decline and cancel all bookings on the platform.
            </p>
         </div>

         {/* Client leaf container — holds TanStack Query hooks & filter state */}
         <BookingsManagementContainer />
      </div>
   )
}
