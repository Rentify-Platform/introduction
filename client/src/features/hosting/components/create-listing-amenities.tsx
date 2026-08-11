'use client'

import { Check, Tv } from 'lucide-react'

interface CreateListingAmenitiesProps {
   amenityIds: number[]
   onAmenityToggle: (id: number) => void
}

export function CreateListingAmenities({
   amenityIds,
   onAmenityToggle
}: CreateListingAmenitiesProps) {
   return (
      <section
         id="amenities"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <Tv className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Amenities</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select what amenities are present in your property.
               </p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
               { id: 1, label: 'Wifi' },
               { id: 2, label: 'Kitchen' },
               { id: 3, label: 'Air Conditioning' },
               { id: 4, label: 'Swimming Pool' },
               { id: 5, label: 'Free Parking' }
            ].map((item) => {
               const isSelected = amenityIds.includes(item.id)
               return (
                  <button
                     key={item.id}
                     type="button"
                     onClick={() => onAmenityToggle(item.id)}
                     className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-bold transition-all ${
                        isSelected
                           ? 'border-[#ff385c] bg-[#ff385c]/5 text-[#ff385c]'
                           : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
                     }`}
                  >
                     <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                           isSelected
                              ? 'border-[#ff385c] bg-[#ff385c] text-white'
                              : 'border-zinc-300 dark:border-zinc-700'
                        }`}
                     >
                        {isSelected && <Check className="h-3 w-3 stroke-3" />}
                     </div>
                     <span>{item.label}</span>
                  </button>
               )
            })}
         </div>
      </section>
   )
}
