'use client'

import * as React from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from '@/components/ui/select'
import { LedgerTxnType, TransactionsFilter } from '@/features/ledger/types'

const TXN_TYPE_LABELS: Record<LedgerTxnType, string> = {
   booking_payment: 'Booking Payment',
   platform_fee: 'Platform Fee',
   host_accrual: 'Host Accrual',
   refund: 'Refund',
   payout: 'Payout',
   tax_remittance: 'Tax Remittance',
   adjustment: 'Adjustment'
}

interface LedgerFilterBarProps {
   filter: TransactionsFilter
   onChange: (filter: TransactionsFilter) => void
}

export function LedgerFilterBar({ filter, onChange }: LedgerFilterBarProps) {
   const [bookingIdInput, setBookingIdInput] = React.useState(filter.bookingId ?? '')

   React.useEffect(() => {
      const timer = setTimeout(() => {
         onChange({ ...filter, bookingId: bookingIdInput.trim() || undefined, page: 1 })
      }, 350)
      return () => clearTimeout(timer)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [bookingIdInput])

   return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
         <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
               id="ledger-booking-id-filter"
               placeholder="Filter by Booking UUID…"
               value={bookingIdInput}
               onChange={(e) => setBookingIdInput(e.target.value)}
               className="border-zinc-200 pl-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-pink-300"
            />
         </div>

         <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />

            <Select
               value={filter.type ?? ''}
               onValueChange={(value) =>
                  onChange({ ...filter, type: (value as LedgerTxnType) || undefined, page: 1 })
               }
            >
               <SelectTrigger
                  id="ledger-type-filter"
                  className="w-48 border-zinc-200 text-sm text-zinc-700"
               >
                  <SelectValue placeholder="All types" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {Object.entries(TXN_TYPE_LABELS).map(([value, label]) => (
                     <SelectItem key={value} value={value}>
                        {label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <Input
               id="ledger-from-filter"
               type="date"
               value={filter.dateFrom ?? ''}
               onChange={(e) =>
                  onChange({ ...filter, dateFrom: e.target.value || undefined, page: 1 })
               }
               className="w-40 border-zinc-200 text-sm text-zinc-700"
            />
            <Input
               id="ledger-to-filter"
               type="date"
               value={filter.dateTo ?? ''}
               onChange={(e) =>
                  onChange({ ...filter, dateTo: e.target.value || undefined, page: 1 })
               }
               className="w-40 border-zinc-200 text-sm text-zinc-700"
            />
         </div>
      </div>
   )
}

export function formatDateRange(from?: string, to?: string): string {
   if (from && to) return `${from} → ${to}`
   if (from) return `from ${from}`
   if (to) return `to ${to}`
   return ''
}
