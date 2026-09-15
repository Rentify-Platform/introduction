'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { BookingStatus } from '@/features/bookings/types'

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
   pending: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border border-amber-200'
   },
   pending_approval: {
      label: 'Pending Approval',
      className: 'bg-sky-50 text-sky-700 border border-sky-200'
   },
   confirmed: {
      label: 'Confirmed',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
   },
   cancelled_by_guest: {
      label: 'Cancelled by Guest',
      className: 'bg-rose-50 text-rose-700 border border-rose-200'
   },
   cancelled_by_host: {
      label: 'Cancelled by Host',
      className: 'bg-red-50 text-red-700 border border-red-200'
   },
   cancelled_by_admin: {
      label: 'Cancelled by Admin',
      className: 'bg-violet-50 text-violet-700 border border-violet-200'
   },
   completed: {
      label: 'Completed',
      className: 'bg-zinc-100 text-zinc-700 border border-zinc-200'
   },
   expired: {
      label: 'Expired',
      className: 'bg-orange-50 text-orange-700 border border-orange-200'
   }
}

interface BookingStatusBadgeProps {
   status: BookingStatus
   className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
   const config = STATUS_CONFIG[status] ?? {
      label: status,
      className: 'bg-zinc-100 text-zinc-700 border border-zinc-200'
   }

   return (
      <span
         className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
            config.className,
            className
         )}
      >
         {config.label}
      </span>
   )
}
