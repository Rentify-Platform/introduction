'use client'

import * as React from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CreateListingPricingProps {
   basePrice: string
   setBasePrice: (v: string) => void
   cleaningFee: string
   setCleaningFee: (v: string) => void
   minimumNights: number
   setMinimumNights: (v: number) => void
   maximumNights: number
   setMaximumNights: (v: number) => void
   checkInTime: string
   setCheckInTime: (v: string) => void
   checkOutTime: string
   setCheckOutTime: (v: string) => void
   instantBook: boolean
   setInstantBook: (v: boolean) => void
}

export function CreateListingPricing({
   basePrice,
   setBasePrice,
   cleaningFee,
   setCleaningFee,
   minimumNights,
   setMinimumNights,
   maximumNights,
   setMaximumNights,
   checkInTime,
   setCheckInTime,
   checkOutTime,
   setCheckOutTime,
   instantBook,
   setInstantBook
}: CreateListingPricingProps) {
   return (
      <section
         id="pricing"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <DollarSign className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Pricing & Terms</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Set the booking rates and nights constraints.
               </p>
            </div>
         </div>

         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input
                  label="Base Price per night (VND)"
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
               />
               <Input
                  label="Cleaning Fee (VND)"
                  type="number"
                  min="0"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(e.target.value)}
                  required
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input
                  label="Minimum Nights"
                  type="number"
                  min="1"
                  value={minimumNights}
                  onChange={(e) => setMinimumNights(Number(e.target.value))}
               />
               <Input
                  label="Maximum Nights"
                  type="number"
                  min="1"
                  value={maximumNights}
                  onChange={(e) => setMaximumNights(Number(e.target.value))}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                     Check-in Time
                  </label>
                  <input
                     type="time"
                     value={checkInTime}
                     onChange={(e) => setCheckInTime(e.target.value)}
                     className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:border-[#ff385c] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                     Check-out Time
                  </label>
                  <input
                     type="time"
                     value={checkOutTime}
                     onChange={(e) => setCheckOutTime(e.target.value)}
                     className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:border-[#ff385c] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
               </div>
            </div>

            {/* Instant Book Switch */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
               <div>
                  <p className="text-sm font-bold">Instant Book</p>
                  <p className="text-zinc-450 text-xs dark:text-zinc-500">
                     Guests can book instantly without waiting for approval.
                  </p>
               </div>
               <button
                  type="button"
                  onClick={() => setInstantBook(!instantBook)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${
                     instantBook ? 'bg-[#ff385c]' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
               >
                  <span
                     className={`absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white transition-transform ${
                        instantBook ? 'translate-x-5' : 'translate-x-0'
                     }`}
                  />
               </button>
            </div>
         </div>
      </section>
   )
}
