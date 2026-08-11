import * as React from 'react'
import { Fingerprint } from 'lucide-react'
import { KycQueueContainer } from './components/kyc-queue-container'

export default function KycQueuePage() {
   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
               <Fingerprint className="h-8 w-8 text-pink-500" />
               KYC Verification Queue
            </h2>
            <p className="text-sm text-zinc-500">
               Manage, review, and verify identity profiles for guests and hosts.
            </p>
         </div>

         {/* Client Leaf Container Component holding TanStack Query hooks & client states */}
         <KycQueueContainer />
      </div>
   )
}
