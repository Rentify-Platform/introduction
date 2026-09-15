'use client'

import * as React from 'react'
import { CalendarDays, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { BookingSummary, BookingsFilter } from '@/features/bookings/types'
import { BookingStatusBadge } from './booking-status-badge'
import { formatDate, formatVND } from '@/lib/utils'

interface BookingsTableProps {
   bookings: BookingSummary[]
   total: number
   filter: BookingsFilter
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onFilterChange: (filter: BookingsFilter) => void
   onApprove: (bookingId: string) => void
   onDecline: (bookingId: string) => void
   onCancel: (bookingId: string) => void
   isPending: boolean
}

function truncateId(id: string) {
   if (!id) return '—'
   return `${id.slice(0, 8)}…`
}

export function BookingsTable({
   bookings,
   total,
   filter,
   isLoading,
   isFetching,
   error,
   onFilterChange,
   onApprove,
   onDecline,
   onCancel,
   isPending
}: BookingsTableProps) {
   const page = filter.page ?? 1
   const limit = filter.limit ?? 20
   const totalPages = Math.max(1, Math.ceil(total / limit))

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="text-lg text-zinc-900">Platform Bookings</CardTitle>
               <CardDescription className="text-zinc-500">
                  {total > 0 ? `${total} bookings found` : 'No bookings match the current filters'}
               </CardDescription>
            </div>
            {isFetching && !isLoading && (
               <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
            )}
         </CardHeader>

         <CardContent className="p-0">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading bookings…</p>
               </div>
            ) : error || bookings.length === 0 ? (
               <div className="py-16 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No bookings found</p>
                  <p className="mt-1 text-xs text-zinc-400">
                     {error ? 'Failed to load data.' : 'Try adjusting your filters.'}
                  </p>
               </div>
            ) : (
               <>
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                           <TableRow className="border-zinc-200 hover:bg-transparent">
                              <TableHead className="text-zinc-500">Booking</TableHead>
                              <TableHead className="text-zinc-500">Guest</TableHead>
                              <TableHead className="text-zinc-500">Host</TableHead>
                              <TableHead className="text-zinc-500">Property</TableHead>
                              <TableHead className="text-zinc-500">Status</TableHead>
                              <TableHead className="text-zinc-500">Check-in</TableHead>
                              <TableHead className="text-zinc-500">Check-out</TableHead>
                              <TableHead className="text-right text-zinc-500">Total</TableHead>
                              <TableHead className="text-zinc-500">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {bookings.map((booking) => (
                              <TableRow key={booking.id} className="border-zinc-100 hover:bg-zinc-50/50">
                                 <TableCell className="font-mono text-xs text-zinc-500">
                                    {truncateId(booking.id)}
                                 </TableCell>
                                 <TableCell>
                                    <div className="min-w-0">
                                       <p className="truncate text-sm font-medium text-zinc-900">
                                          {booking.guestName || 'Unknown guest'}
                                       </p>
                                       {booking.guestEmail && (
                                          <p className="truncate text-xs text-zinc-500">
                                             {booking.guestEmail}
                                          </p>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="min-w-0">
                                       <p className="truncate text-sm font-medium text-zinc-900">
                                          {booking.hostName || 'Unknown host'}
                                       </p>
                                       {booking.hostEmail && (
                                          <p className="truncate text-xs text-zinc-500">
                                             {booking.hostEmail}
                                          </p>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="min-w-0 max-w-56">
                                       <p className="truncate text-sm font-medium text-zinc-900">
                                          {booking.propertyTitle || truncateId(booking.propertyId)}
                                       </p>
                                       {booking.propertyCity && (
                                          <p className="truncate text-xs text-zinc-500">
                                             {booking.propertyCity}
                                          </p>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <BookingStatusBadge status={booking.status} />
                                 </TableCell>
                                 <TableCell className="text-xs text-zinc-500">
                                    {formatDate(booking.checkIn)}
                                 </TableCell>
                                 <TableCell className="text-xs text-zinc-500">
                                    {formatDate(booking.checkOut)}
                                 </TableCell>
                                 <TableCell className="text-right text-sm font-medium text-zinc-900">
                                    {formatVND(Number(booking.totalPriceCents))}
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex items-center gap-1">
                                       {booking.status === 'pending_approval' && (
                                          <>
                                             <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                                                disabled={isPending}
                                                onClick={() => onApprove(booking.id)}
                                             >
                                                Approve
                                             </Button>
                                             <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
                                                disabled={isPending}
                                                onClick={() => onDecline(booking.id)}
                                             >
                                                Decline
                                             </Button>
                                          </>
                                       )}
                                       {(booking.status === 'pending' ||
                                          booking.status === 'pending_approval' ||
                                          booking.status === 'confirmed') && (
                                          <Button
                                             size="sm"
                                             variant="outline"
                                             className="h-7 border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                                             disabled={isPending}
                                             onClick={() => onCancel(booking.id)}
                                          >
                                             Cancel
                                          </Button>
                                       )}
                                       {booking.status !== 'pending_approval' &&
                                          booking.status !== 'pending' &&
                                          booking.status !== 'confirmed' && (
                                             <span className="text-xs text-zinc-300">—</span>
                                          )}
                                    </div>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                     <p className="text-xs text-zinc-500">
                        Page {page} of {totalPages} — {total} total
                     </p>
                     <div className="flex items-center gap-1">
                        <Button
                           id="bookings-prev-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page <= 1 || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page - 1 })}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           id="bookings-next-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page >= totalPages || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page + 1 })}
                        >
                           <ChevronRight className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
               </>
            )}
         </CardContent>
      </Card>
   )
}
