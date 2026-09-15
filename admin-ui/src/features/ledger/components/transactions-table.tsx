'use client'

import * as React from 'react'
import { Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { LedgerTransaction, LedgerTxnType, TransactionsFilter } from '@/features/ledger/types'
import { cn, formatDate, formatVND } from '@/lib/utils'

const TXN_TYPE_LABELS: Record<LedgerTxnType, string> = {
   booking_payment: 'Booking Payment',
   platform_fee: 'Platform Fee',
   host_accrual: 'Host Accrual',
   refund: 'Refund',
   payout: 'Payout',
   tax_remittance: 'Tax Remittance',
   adjustment: 'Adjustment'
}

const TXN_TYPE_CLASSES: Record<LedgerTxnType, string> = {
   booking_payment: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
   platform_fee: 'bg-sky-50 text-sky-700 border border-sky-200',
   host_accrual: 'bg-violet-50 text-violet-700 border border-violet-200',
   refund: 'bg-rose-50 text-rose-700 border border-rose-200',
   payout: 'bg-amber-50 text-amber-700 border border-amber-200',
   tax_remittance: 'bg-orange-50 text-orange-700 border border-orange-200',
   adjustment: 'bg-zinc-100 text-zinc-700 border border-zinc-200'
}

interface TransactionsTableProps {
   transactions: LedgerTransaction[]
   total: number
   filter: TransactionsFilter
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onFilterChange: (filter: TransactionsFilter) => void
}

function truncateId(id: string) {
   if (!id) return '—'
   return `${id.slice(0, 8)}…`
}

function txnNetAmount(txn: LedgerTransaction): number {
   return txn.entries.reduce((sum, entry) => {
      const value = Number(entry.amountCents)
      return sum + (Number.isFinite(value) && value > 0 ? value : 0)
   }, 0)
}

export function TransactionsTable({
   transactions,
   total,
   filter,
   isLoading,
   isFetching,
   error,
   onFilterChange
}: TransactionsTableProps) {
   const page = filter.page ?? 1
   const limit = filter.limit ?? 20
   const totalPages = Math.max(1, Math.ceil(total / limit))

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="text-lg text-zinc-900">Ledger Transactions</CardTitle>
               <CardDescription className="text-zinc-500">
                  {total > 0
                     ? `${total} transactions found`
                     : 'No transactions match the current filters'}
               </CardDescription>
            </div>
            {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-pink-400" />}
         </CardHeader>

         <CardContent className="p-0">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading transactions…</p>
               </div>
            ) : error || transactions.length === 0 ? (
               <div className="py-16 text-center">
                  <Receipt className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No transactions found</p>
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
                              <TableHead className="text-zinc-500">Transaction</TableHead>
                              <TableHead className="text-zinc-500">Type</TableHead>
                              <TableHead className="text-zinc-500">Booking</TableHead>
                              <TableHead className="text-zinc-500">Entries</TableHead>
                              <TableHead className="text-right text-zinc-500">Net Amount</TableHead>
                              <TableHead className="text-zinc-500">Created</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {transactions.map((txn) => (
                              <TableRow
                                 key={txn.id}
                                 className="border-zinc-100 hover:bg-zinc-50/50"
                              >
                                 <TableCell>
                                    <p className="font-mono text-xs text-zinc-500">
                                       {truncateId(txn.id)}
                                    </p>
                                    {txn.description && (
                                       <p className="mt-0.5 max-w-48 truncate text-xs text-zinc-400">
                                          {txn.description}
                                       </p>
                                    )}
                                 </TableCell>
                                 <TableCell>
                                    <span
                                       className={cn(
                                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                                          TXN_TYPE_CLASSES[txn.type] ??
                                             'border border-zinc-200 bg-zinc-100 text-zinc-700'
                                       )}
                                    >
                                       {TXN_TYPE_LABELS[txn.type] ?? txn.type}
                                    </span>
                                 </TableCell>
                                 <TableCell className="font-mono text-xs text-zinc-500">
                                    {txn.bookingId ? (
                                       truncateId(txn.bookingId)
                                    ) : (
                                       <span className="text-zinc-300">—</span>
                                    )}
                                 </TableCell>
                                 <TableCell className="text-xs text-zinc-500">
                                    {txn.entries.length}
                                 </TableCell>
                                 <TableCell className="text-right text-sm font-medium text-zinc-900">
                                    {formatVND(txnNetAmount(txn))}
                                 </TableCell>
                                 <TableCell className="text-xs text-zinc-500">
                                    {formatDate(txn.createdAt)}
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
                           id="transactions-prev-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page <= 1 || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page - 1 })}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           id="transactions-next-page"
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
