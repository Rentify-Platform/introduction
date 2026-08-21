'use client'

import * as React from 'react'
import { useBookingsQueries } from '@/features/bookings/hooks/use-bookings-queries'
import { useBookingsMutations } from '@/features/bookings/hooks/use-bookings-mutations'
import { BookingsFilterBar } from '@/features/bookings/components/bookings-filter-bar'
import { BookingsTable } from '@/features/bookings/components/bookings-table'
import { BookingsFilter } from '@/features/bookings/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCancellationsQuery } from '@/features/cancellations/hooks/use-cancellations'
import { CancellationsTable } from '@/features/cancellations/components/cancellations-table'
import { OverrideCancellationModal } from '@/features/cancellations/components/override-cancellation-modal'
import { Cancellation } from '@/features/cancellations/types'

export function BookingsManagementContainer() {
   const [filter, setFilter] = React.useState<BookingsFilter>({ page: 1, limit: 20 })
   const [cancellationPage, setCancellationPage] = React.useState(1)
   const [selectedCancellation, setSelectedCancellation] = React.useState<Cancellation | null>(null)

   const { bookings, total, page, limit, isLoading, isFetching, error } =
      useBookingsQueries(filter)
   const { approve, decline, cancel, isPending } = useBookingsMutations()
   
   const { data: cancellationsData } = useCancellationsQuery(cancellationPage, 20)

   return (
      <div className="space-y-4">
         <Tabs defaultValue="all" className="w-full">
            <TabsList>
               <TabsTrigger value="all">All Bookings</TabsTrigger>
               <TabsTrigger value="cancellations">Cancellations</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
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
            </TabsContent>

            <TabsContent value="cancellations" className="space-y-4 mt-4">
               <CancellationsTable 
                  cancellations={cancellationsData?.data || []}
                  onOverride={(c) => setSelectedCancellation(c)}
               />
            </TabsContent>
         </Tabs>

         <OverrideCancellationModal 
            cancellation={selectedCancellation}
            isOpen={!!selectedCancellation}
            onClose={() => setSelectedCancellation(null)}
         />
      </div>
   )
}
