import * as React from 'react'
import { Receipt } from 'lucide-react'
import { LedgerManagementContainer } from './components/ledger-management-container'

export const metadata = {
   title: 'Ledger & Payouts — Rentify Admin',
   description: 'View all ledger transactions, balances, payouts and platform fee configuration'
}

export default function LedgerManagementPage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <Receipt className="h-8 w-8 text-pink-500" />
               Ledger & Payouts
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
               Inspect ledger transactions, account balances and host payouts, and manage platform
               fee rules.
            </p>
         </div>

         {/* Client leaf container — holds TanStack Query hooks & tab state */}
         <LedgerManagementContainer />
      </div>
   )
}
