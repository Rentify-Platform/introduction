'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CheckoutHeaderProps {
   isConfirmed: boolean
}

export function CheckoutHeader({ isConfirmed }: CheckoutHeaderProps) {
   const router = useRouter()

   return (
      <header className="border-zinc-150 border-b bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950">
         <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
            <div
               onClick={() => router.push('/')}
               className="cursor-pointer text-xl font-extrabold tracking-tight text-[#ff385c]"
            >
               rentify
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
               <span>1. Review & Pay</span>
               <ArrowRight className="h-3 w-3" />
               <span className={isConfirmed ? 'font-bold text-emerald-500' : ''}>
                  2. Confirmation
               </span>
            </div>
         </div>
      </header>
   )
}
