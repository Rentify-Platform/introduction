'use client'

import * as React from 'react'
import { useBookingsQueries } from '@/features/bookings/hooks/use-bookings-queries'
import { useBookingsMutations } from '@/features/bookings/hooks/use-bookings-mutations'
import { BookingsFilterBar } from '@/features/bookings/components/bookings-filter-bar'
import { BookingsTable } from '@/features/bookings/components/bookings-table'
import { BookingsFilter } from '@/features/bookings/types'

export function BookingsManagementContainer() {
   const [filter, setFilter] = React.useState<BookingsFilter>({ page: 1, limit: 20 })

   const { bookings, total, page, limit, isLoading, isFetching, error } =
      useBookingsQueries(filter)
   const { approve, decline, cancel, isPending } = useBookingsMutations()

   return (
      <div className="space-y-4">
         <BookingsFilterBar filter={filter} onChange={setFilter} />

         <BookingsTable
            bookings={bookings}
            total={total}
            filter={{ ...filter, page, limit }}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            onFilterChange={setFilter}
            onApprove={(bookingId) => approve(bookingId)}
            onDecline={(bookingId) => decline({ bookingId })}
            onCancel={(bookingId) => cancel({ bookingId })}
            isPending={isPending}
         />
      </div>
   )
}
