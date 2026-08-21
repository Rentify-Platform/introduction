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
import { UsersFilter, AccountRole, AccountStatus } from '@/features/users/types'

interface UsersFilterBarProps {
   filter: UsersFilter
   onChange: (filter: UsersFilter) => void
}

export function UsersFilterBar({ filter, onChange }: UsersFilterBarProps) {
   const [searchInput, setSearchInput] = React.useState(filter.search ?? '')

   // Debounce search so we don't fire on every keystroke
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
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
               id="users-search"
               placeholder="Search by name or email…"
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               className="border-zinc-200 pl-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-pink-300"
            />
         </div>

         <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />

            <Select
               value={filter.role ?? ''}
               onValueChange={(value) =>
                  onChange({ ...filter, role: (value as AccountRole) || undefined, page: 1 })
               }
            >
               <SelectTrigger
                  id="users-role-filter"
                  className="w-36 border-zinc-200 text-sm text-zinc-700"
               >
                  <SelectValue placeholder="All roles" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
               </SelectContent>
            </Select>

            <Select
               value={filter.status ?? ''}
               onValueChange={(value) =>
                  onChange({ ...filter, status: (value as AccountStatus) || undefined, page: 1 })
               }
            >
               <SelectTrigger
                  id="users-status-filter"
                  className="w-36 border-zinc-200 text-sm text-zinc-700"
               >
                  <SelectValue placeholder="All statuses" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>
   )
}
