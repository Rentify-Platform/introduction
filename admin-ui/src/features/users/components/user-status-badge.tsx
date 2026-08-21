'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { AccountStatus } from '@/features/users/types'

const STATUS_CONFIG: Record<AccountStatus, { label: string; className: string }> = {
   active: {
      label: 'Active',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
   },
   suspended: {
      label: 'Suspended',
      className: 'bg-amber-50 text-amber-700 border border-amber-200'
   },
   banned: {
      label: 'Banned',
      className: 'bg-rose-50 text-rose-700 border border-rose-200'
   }
}

interface UserStatusBadgeProps {
   status: AccountStatus
   className?: string
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
   const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active

   return (
      <span
         className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            config.className,
            className
         )}
      >
         {config.label}
      </span>
   )
}
