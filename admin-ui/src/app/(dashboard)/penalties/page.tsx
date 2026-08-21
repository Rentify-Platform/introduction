import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { PenaltiesManagementContainer } from './components/penalties-management-container'

export const metadata = {
   title: 'Penalties Management — Rentify Admin',
   description: 'Manage host penalties and violations'
}

export default function PenaltiesManagementPage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <AlertCircle className="h-8 w-8 text-pink-500" />
               Host Penalties
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
               View and manage penalties applied to hosts for cancellations or policy violations.
            </p>
         </div>

         <PenaltiesManagementContainer />
      </div>
   )
}
