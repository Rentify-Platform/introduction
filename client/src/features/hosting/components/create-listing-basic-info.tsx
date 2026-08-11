'use client'

import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'

interface CreateListingBasicInfoProps {
   title: string
   setTitle: (v: string) => void
   description: string
   setDescription: (v: string) => void
   propertyTypeId: number
   setPropertyTypeId: (v: number) => void
   roomType: string
   setRoomType: (v: string) => void
}

export function CreateListingBasicInfo({
   title,
   setTitle,
   description,
   setDescription,
   propertyTypeId,
   setPropertyTypeId,
   roomType,
   setRoomType
}: CreateListingBasicInfoProps) {
   return (
      <section
         id="basic-info"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <Info className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Basic Information</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Set the main descriptions and property structures.
               </p>
            </div>
         </div>

         <div className="space-y-5">
            <Input
               label="Listing Title"
               placeholder="e.g. Cozy Beachfront Villa with Pool"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               required
            />

            <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Description
               </label>
               <textarea
                  placeholder="Describe the unique features, atmosphere, and amenities of your property..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] w-full rounded-none border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-[#ff385c] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
               />
            </div>

            {/* Property Type Lookup */}
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Property Type
               </label>
               <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                     { id: 1, label: 'Home' },
                     { id: 2, label: 'Apartment' },
                     { id: 3, label: 'Guesthouse' },
                     { id: 4, label: 'Cabin' },
                     { id: 5, label: 'Villa' }
                  ].map((item) => (
                     <button
                        key={item.id}
                        type="button"
                        onClick={() => setPropertyTypeId(item.id)}
                        className={`rounded-lg border p-2.5 text-center text-xs font-bold transition-all ${
                           propertyTypeId === item.id
                              ? 'border-[#ff385c] bg-[#ff385c]/5 text-[#ff385c]'
                              : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                     >
                        {item.label}
                     </button>
                  ))}
               </div>
            </div>

            {/* Room Type */}
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Room Type
               </label>
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                     { code: 'entire_place', label: 'Entire Place' },
                     { code: 'private_room', label: 'Private Room' },
                     { code: 'shared_room', label: 'Shared Room' }
                  ].map((item) => (
                     <button
                        key={item.code}
                        type="button"
                        onClick={() => setRoomType(item.code)}
                        className={`rounded-lg border p-2.5 text-center text-xs font-bold transition-all ${
                           roomType === item.code
                              ? 'border-[#ff385c] bg-[#ff385c]/5 text-[#ff385c]'
                              : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                     >
                        {item.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </section>
   )
}
