'use client'

import * as React from 'react'
import {
   Banknote,
   Loader2,
   ChevronLeft,
   ChevronRight,
   Search,
   SlidersHorizontal
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from '@/components/ui/select'
import { Payout, PayoutStatus, PayoutsFilter } from '@/features/ledger/types'
import { cn, formatDate, formatVND } from '@/lib/utils'

const STATUS_CONFIG: Record<PayoutStatus, { label: string; className: string }> = {
   pending: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border border-amber-200'
   },
   processing: {
      label: 'Processing',
      className: 'bg-sky-50 text-sky-700 border border-sky-200'
   },
   paid: {
      label: 'Paid',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
   },
   failed: {
      label: 'Failed',
      className: 'bg-rose-50 text-rose-700 border border-rose-200'
   }
}

interface PayoutsTableProps {
   payouts: Payout[]
   total: number
   filter: PayoutsFilter
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onFilterChange: (filter: PayoutsFilter) => void
}

function truncateId(id: string) {
   if (!id) return '—'
   return `${id.slice(0, 8)}…`
}

export function PayoutsTable({
   payouts,
   total,
   filter,
   isLoading,
   isFetching,
   error,
   onFilterChange
}: PayoutsTableProps) {
   const page = filter.page ?? 1
   const limit = filter.limit ?? 20
   const totalPages = Math.max(1, Math.ceil(total / limit))

   const [hostIdInput, setHostIdInput] = React.useState(filter.hostId ?? '')

   React.useEffect(() => {
      const timer = setTimeout(() => {
         onFilterChange({ ...filter, hostId: hostIdInput.trim() || undefined, page: 1 })
      }, 350)
      return () => clearTimeout(timer)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [hostIdInput])

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="space-y-4 border-b border-zinc-200 pb-4">
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-lg text-zinc-900">Host Payouts</CardTitle>
                  <CardDescription className="text-zinc-500">
                     {total > 0 ? `${total} payouts found` : 'No payouts match the current filters'}
                  </CardDescription>
               </div>
               {isFetching && !isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
               )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
               <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                     id="payouts-host-id-filter"
                     placeholder="Filter by Host UUID…"
                     value={hostIdInput}
                     onChange={(e) => setHostIdInput(e.target.value)}
                     className="border-zinc-200 pl-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-pink-300"
                  />
               </div>

               <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />

                  <Select
                     value={filter.status ?? ''}
                     onValueChange={(value) =>
                        onFilterChange({
                           ...filter,
                           status: (value as PayoutStatus) || undefined,
                           page: 1
                        })
                     }
                  >
                     <SelectTrigger
                        id="payouts-status-filter"
                        className="w-40 border-zinc-200 text-sm text-zinc-700"
                     >
                        <SelectValue placeholder="All statuses" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                     </SelectContent>
                  </Select>

                  <Input
                     id="payouts-from-filter"
                     type="date"
                     value={filter.scheduledForFrom ?? ''}
                     onChange={(e) =>
                        onFilterChange({
                           ...filter,
                           scheduledForFrom: e.target.value || undefined,
                           page: 1
                        })
                     }
                     className="w-40 border-zinc-200 text-sm text-zinc-700"
                  />
                  <Input
                     id="payouts-to-filter"
                     type="date"
                     value={filter.scheduledForTo ?? ''}
                     onChange={(e) =>
                        onFilterChange({
                           ...filter,
                           scheduledForTo: e.target.value || undefined,
                           page: 1
                        })
                     }
                     className="w-40 border-zinc-200 text-sm text-zinc-700"
                  />
               </div>
            </div>
         </CardHeader>

         <CardContent className="p-0">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading payouts…</p>
               </div>
            ) : error || payouts.length === 0 ? (
               <div className="py-16 text-center">
                  <Banknote className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No payouts found</p>
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
                              <TableHead className="text-zinc-500">Payout</TableHead>
                              <TableHead className="text-zinc-500">Host</TableHead>
                              <TableHead className="text-zinc-500">Status</TableHead>
                              <TableHead className="text-right text-zinc-500">Amount</TableHead>
                              <TableHead className="text-zinc-500">Scheduled</TableHead>
                              <TableHead className="text-zinc-500">Paid At</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {payouts.map((payout) => {
                              const statusConfig = STATUS_CONFIG[payout.status] ?? {
                                 label: payout.status,
                                 className: 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                              }
                              return (
                                 <TableRow
                                    key={payout.id}
                                    className="border-zinc-100 hover:bg-zinc-50/50"
                                 >
                                    <TableCell>
                                       <p className="font-mono text-xs text-zinc-500">
                                          {truncateId(payout.id)}
                                       </p>
                                       {payout.providerPayoutId && (
                                          <p className="mt-0.5 max-w-40 truncate font-mono text-xs text-zinc-400">
                                             {payout.providerPayoutId}
                                          </p>
                                       )}
                                    </TableCell>
                                    <TableCell>
                                       <p className="text-sm font-medium text-zinc-900">
                                          {payout.hostName || truncateId(payout.hostId)}
                                       </p>
                                       {payout.hostEmail && (
                                          <p className="truncate font-mono text-xs text-zinc-400">
                                             {payout.hostEmail}
                                          </p>
                                       )}
                                    </TableCell>
                                    <TableCell>
                                       <span
                                          className={cn(
                                             'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                                             statusConfig.className
                                          )}
                                       >
                                          {statusConfig.label}
                                       </span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-medium text-zinc-900">
                                       {formatVND(Number(payout.amountCents))}
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500">
                                       {formatDate(payout.scheduledFor)}
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500">
                                       {payout.paidAt ? (
                                          formatDate(payout.paidAt)
                                       ) : (
                                          <span className="text-zinc-300">—</span>
                                       )}
                                    </TableCell>
                                 </TableRow>
                              )
                           })}
                        </TableBody>
                     </Table>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                     <p className="text-xs text-zinc-500">
                        Page {page} of {totalPages} — {total} total
                     </p>
                     <div className="flex items-center gap-1">
                        <Button
                           id="payouts-prev-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page <= 1 || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page - 1 })}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           id="payouts-next-page"
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
