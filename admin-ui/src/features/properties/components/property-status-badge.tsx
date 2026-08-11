'use client'

import { cn } from '@/lib/utils'
import { PropertyStatus } from '@/features/properties/types'

const STATUS_CONFIG: Record<PropertyStatus, { label: string; className: string }> = {
   draft: {
      label: 'Draft',
      className: 'bg-zinc-100 text-zinc-600 border border-zinc-200'
   },
   active: {
      label: 'Active',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
   },
   paused: {
      label: 'Paused',
      className: 'bg-amber-50 text-amber-700 border border-amber-200'
   },
   archived: {
      label: 'Archived',
      className: 'bg-rose-50 text-rose-700 border border-rose-200'
   }
}

interface PropertyStatusBadgeProps {
   status: PropertyStatus
   className?: string
}

export function PropertyStatusBadge({ status, className }: PropertyStatusBadgeProps) {
   const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
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
