'use client'

import Image from 'next/image'

interface PropertyHostInfoProps {
   roomType: string
   maxGuests: number
   bedrooms: number
   beds: number
   bathrooms: number
}

export function PropertyHostInfo({
   roomType,
   maxGuests,
   bedrooms,
   beds,
   bathrooms
}: PropertyHostInfoProps) {
   const formattedRoomType = roomType
      ? roomType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Entire Place'

   return (
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6 font-sans dark:border-zinc-800">
         <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
               {formattedRoomType} hosted by Local Host
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
               {maxGuests} guests · {bedrooms} bedrooms · {beds} beds · {Number(bathrooms)} bath
            </p>
         </div>
         <div className="relative h-12 w-12 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
            <Image
               src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
               alt="Host Avatar"
               fill
               sizes="48px"
               className="object-cover"
            />
         </div>
      </div>
   )
}
