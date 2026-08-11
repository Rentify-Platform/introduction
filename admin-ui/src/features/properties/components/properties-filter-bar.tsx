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
import { PropertiesFilter, PropertyStatus } from '@/features/properties/types'

interface PropertiesFilterBarProps {
   filter: PropertiesFilter
   onChange: (filter: PropertiesFilter) => void
}

export function PropertiesFilterBar({ filter, onChange }: PropertiesFilterBarProps) {
   const [searchInput, setSearchInput] = React.useState(filter.search ?? '')

   React.useEffect(() => {
      const timer = setTimeout(() => {
         onChange({ ...filter, search: searchInput || undefined, page: 1 })
      }, 350)
      return () => clearTimeout(timer)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchInput])

   return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
               id="properties-search"
               placeholder="Search by title, city or country…"
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               className="border-zinc-200 pl-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-pink-300"
            />
         </div>

         <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />
            <Select
               value={filter.status ?? ''}
               onValueChange={(value) =>
                  onChange({ ...filter, status: (value as PropertyStatus) || undefined, page: 1 })
               }
            >
               <SelectTrigger
                  id="properties-status-filter"
                  className="w-40 border-zinc-200 text-sm text-zinc-700"
               >
                  <SelectValue placeholder="All statuses" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>
   )
}
