'use client'

import * as React from 'react'
import { Wifi, Tv, Car, Wind, Utensils, Flame, Check } from 'lucide-react'
import { Amenity } from '@/features/listings/types'

interface PropertyAmenitiesProps {
   amenities: Amenity[]
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
   const [showAll, setShowAll] = React.useState(false)

   const getAmenityIcon = (name: string) => {
      const lower = name.toLowerCase()
      if (lower.includes('wifi') || lower.includes('internet')) return Wifi
      if (lower.includes('tv') || lower.includes('television')) return Tv
      if (lower.includes('air conditioning') || lower.includes('ac')) return Wind
      if (lower.includes('parking') || lower.includes('garage')) return Car
      if (lower.includes('kitchen') || lower.includes('cooking') || lower.includes('stove'))
         return Utensils
      if (lower.includes('pool') || lower.includes('swimming')) return Flame
      return Check
   }

   if (!amenities || amenities.length === 0) {
      return null
   }

   const visibleList = showAll ? amenities : amenities.slice(0, 6)

   return (
      <div className="animate-in fade-in border-b border-zinc-200 pb-6 font-sans text-zinc-900 duration-200 dark:border-zinc-800 dark:text-zinc-100">
         <h3 className="mb-4 text-lg font-bold">What this place offers</h3>
         <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {visibleList.map((amenity) => {
               const Icon = getAmenityIcon(amenity.name)
               return (
                  <div key={amenity.id} className="flex items-center gap-3">
                     <Icon className="h-5 w-5 shrink-0 text-zinc-500" />
                     <span>{amenity.name}</span>
                  </div>
               )
            })}
         </div>
         {amenities.length > 6 && (
            <button
               onClick={() => setShowAll(!showAll)}
               className="mt-6 rounded-md border border-zinc-800 px-6 py-3 text-sm font-semibold transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-200 dark:hover:bg-zinc-900"
            >
               {showAll ? 'Show less' : `Show all ${amenities.length} amenities`}
            </button>
         )}
      </div>
   )
}
