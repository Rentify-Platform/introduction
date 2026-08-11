'use client'

import * as React from 'react'
import { Users, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateListingCapacityProps {
   maxGuests: number
   setMaxGuests: React.Dispatch<React.SetStateAction<number>>
   bedrooms: number
   setBedrooms: React.Dispatch<React.SetStateAction<number>>
   beds: number
   setBeds: React.Dispatch<React.SetStateAction<number>>
   bathrooms: number
   setBathrooms: React.Dispatch<React.SetStateAction<number>>
}

export function CreateListingCapacity({
   maxGuests,
   setMaxGuests,
   bedrooms,
   setBedrooms,
   beds,
   setBeds,
   bathrooms,
   setBathrooms
}: CreateListingCapacityProps) {
   return (
      <section
         id="capacity"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <Users className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Capacity & Layout</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Set the max quantity limits for guests and rooms.
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Max Guests */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
               <div>
                  <p className="text-sm font-bold">Max Guests</p>
                  <p className="text-zinc-450 text-xs">Total guests allowed</p>
               </div>
               <div className="flex items-center gap-3">
                  <Button
                     type="button"
                     onClick={() => setMaxGuests((p) => Math.max(1, p - 1))}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-extrabold">{maxGuests}</span>
                  <Button
                     type="button"
                     onClick={() => setMaxGuests((p) => p + 1)}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Plus className="h-4 w-4" />
                  </Button>
               </div>
            </div>

            {/* Bedrooms */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
               <div>
                  <p className="text-sm font-bold">Bedrooms</p>
                  <p className="text-zinc-450 text-xs">Total bedroom areas</p>
               </div>
               <div className="flex items-center gap-3">
                  <Button
                     type="button"
                     onClick={() => setBedrooms((p) => Math.max(0, p - 1))}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-extrabold">{bedrooms}</span>
                  <Button
                     type="button"
                     onClick={() => setBedrooms((p) => p + 1)}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Plus className="h-4 w-4" />
                  </Button>
               </div>
            </div>

            {/* Beds */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
               <div>
                  <p className="text-sm font-bold">Beds</p>
                  <p className="text-zinc-450 text-xs">Total bed units</p>
               </div>
               <div className="flex items-center gap-3">
                  <Button
                     type="button"
                     onClick={() => setBeds((p) => Math.max(0, p - 1))}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-extrabold">{beds}</span>
                  <Button
                     type="button"
                     onClick={() => setBeds((p) => p + 1)}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Plus className="h-4 w-4" />
                  </Button>
               </div>
            </div>

            {/* Bathrooms */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
               <div>
                  <p className="text-sm font-bold">Bathrooms</p>
                  <p className="text-zinc-450 text-xs">Total bathroom facilities</p>
               </div>
               <div className="flex items-center gap-3">
                  <Button
                     type="button"
                     onClick={() => setBathrooms((p) => Math.max(0, p - 0.5))}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-extrabold">{bathrooms}</span>
                  <Button
                     type="button"
                     onClick={() => setBathrooms((p) => p + 0.5)}
                     variant="outline"
                     size="icon"
                     className="h-8 w-8 rounded-full"
                  >
                     <Plus className="h-4 w-4" />
                  </Button>
               </div>
            </div>
         </div>
      </section>
   )
}
