'use client'

import { ShieldCheck, Sparkles, MapPin } from 'lucide-react'

interface PropertyHighlightsProps {
   roomType: string
}

export function PropertyHighlights({ roomType }: PropertyHighlightsProps) {
   const formattedRoomType = roomType
      ? roomType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Entire Place'

   return (
      <div className="space-y-6 border-b border-zinc-200 pb-6 font-sans text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
         <div className="flex gap-4">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-zinc-800 dark:text-zinc-200" />
            <div>
               <h3 className="font-bold">Entire home</h3>
               <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                  {"You'll have the "}
                  {formattedRoomType.toLowerCase()}
                  {' to yourself.'}
               </p>
            </div>
         </div>
         <div className="flex gap-4">
            <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-zinc-800 dark:text-zinc-200" />
            <div>
               <h3 className="font-bold">Enhanced Clean</h3>
               <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                  This host committed to our rigorous cleaning protocol.
               </p>
            </div>
         </div>
         <div className="flex gap-4">
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-zinc-800 dark:text-zinc-200" />
            <div>
               <h3 className="font-bold">Great location</h3>
               <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                  95% of recent guests gave the location a 5-star rating.
               </p>
            </div>
         </div>
      </div>
   )
}
