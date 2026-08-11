import * as React from 'react'
import { Users2 } from 'lucide-react'
import { UsersManagementContainer } from './components/users-management-container'

export const metadata = {
   title: 'User Management — Rentify Admin',
   description: 'View, search, filter and manage platform user accounts'
}

export default function UsersManagementPage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <Users2 className="h-8 w-8 text-pink-500" />
               User Management
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
               Search, filter, and manage all guest and host accounts on the platform.
            </p>
         </div>

         {/* Client leaf container — holds TanStack Query hooks & filter state */}
         <UsersManagementContainer />
      </div>
   )
}
