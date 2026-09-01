'use client'

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PropertySummary } from '@/features/properties/types'
import { MoreHorizontal, CheckCircle2, PauseCircle, Archive, FileText } from 'lucide-react'

interface PropertyActionsMenuProps {
   property: PropertySummary
   onUpdateStatus: (propertyId: string, status: 'active' | 'paused' | 'archived') => void
   onViewLicense: (propertyId: string, title: string) => void
   isLoading?: boolean
}

export function PropertyActionsMenu({
   property,
   onUpdateStatus,
   onViewLicense,
   isLoading
}: PropertyActionsMenuProps) {
   const isActive = property.status === 'active'
   const isPaused = property.status === 'paused'
   const isArchived = property.status === 'archived'

   return (
      <DropdownMenu>
         <DropdownMenuTrigger
            id={`property-actions-${property.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-50"
            disabled={isLoading}
            aria-label={`Open actions for ${property.title}`}
         >
            <MoreHorizontal className="h-4 w-4" />
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
               id={`view-license-${property.id}`}
               className="cursor-pointer gap-2 text-zinc-700 focus:bg-zinc-50"
               onClick={() => onViewLicense(property.id, property.title)}
            >
               <FileText className="h-3.5 w-3.5" />
               View License Doc
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <p className="px-2 py-1 text-xs font-medium text-zinc-400">Status Override</p>
            <DropdownMenuSeparator />

            {!isActive && (
               <DropdownMenuItem
                  id={`activate-property-${property.id}`}
                  className="cursor-pointer gap-2 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                  onClick={() => onUpdateStatus(property.id, 'active')}
               >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Set Active
               </DropdownMenuItem>
            )}

            {!isPaused && (
               <DropdownMenuItem
                  id={`pause-property-${property.id}`}
                  className="cursor-pointer gap-2 text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                  onClick={() => onUpdateStatus(property.id, 'paused')}
               >
                  <PauseCircle className="h-3.5 w-3.5" />
                  Pause Property
               </DropdownMenuItem>
            )}

            {!isArchived && (
               <DropdownMenuItem
                  id={`archive-property-${property.id}`}
                  className="cursor-pointer gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                  onClick={() => onUpdateStatus(property.id, 'archived')}
               >
                  <Archive className="h-3.5 w-3.5" />
                  Archive Property
               </DropdownMenuItem>
            )}
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
