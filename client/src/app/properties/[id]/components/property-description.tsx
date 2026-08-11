'use client'

import * as React from 'react'

interface PropertyDescriptionProps {
   description: string | null
}

export function PropertyDescription({ description }: PropertyDescriptionProps) {
   const [showFullDesc, setShowFullDesc] = React.useState(false)

   return (
      <div className="border-b border-zinc-200 pb-6 font-sans dark:border-zinc-800">
         <p
            className={`text-zinc-655 dark:text-zinc-355 text-sm leading-relaxed ${
               showFullDesc ? '' : 'line-clamp-4'
            }`}
         >
            {description ||
               'Escape to a realm of unparalleled tranquility in this beautiful property. Suspended high and surrounded by scenic natural landscapes, this architectural marvel offers panoramic views, blending luxury with a profound connection to nature.'}
         </p>
         <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="mt-4 flex items-center text-sm font-semibold underline transition-colors hover:text-zinc-950 dark:hover:text-white"
         >
            {showFullDesc ? 'Show less' : 'Show more >'}
         </button>
      </div>
   )
}
