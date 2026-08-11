import * as React from 'react'
import { Building2 } from 'lucide-react'
import { PropertiesManagementContainer } from './components/properties-management-container'

export const metadata = {
   title: 'Property Management — Rentify Admin',
   description: 'Browse, filter, and manage all host property listings on the platform'
}

export default function PropertiesManagementPage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <Building2 className="h-8 w-8 text-pink-500" />
               Property Management
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
               Review host listings, check license documents, and manage property status across the
               platform.
            </p>
         </div>

         <PropertiesManagementContainer />
      </div>
   )
}
