'use client'

import { Star, ShieldCheck, Share, Heart } from 'lucide-react'

interface PropertyHeaderProps {
   title: string
   averageRating: number
   totalReviews: number
   formattedLocation: string
   isFavorited: boolean
   onToggleFavorite: () => void
   onShare: () => void
}

export function PropertyHeader({
   title,
   averageRating,
   totalReviews,
   formattedLocation,
   isFavorited,
   onToggleFavorite,
   onShare
}: PropertyHeaderProps) {
   return (
      <div className="mb-6 font-sans">
         <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
            {title}
         </h1>
         <div className="mt-2 flex flex-col justify-between gap-4 text-sm text-zinc-900 sm:flex-row sm:items-center dark:text-zinc-100">
            <div className="flex flex-wrap items-center gap-2">
               <span className="flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-current text-zinc-900 dark:text-zinc-100" />
                  {averageRating ? averageRating.toFixed(2) : 'New'}
               </span>
               <span className="text-zinc-300 dark:text-zinc-700">·</span>
               <span className="cursor-pointer font-semibold underline">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
               </span>
               <span className="text-zinc-300 dark:text-zinc-700">·</span>
               <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  <ShieldCheck className="h-4 w-4 text-[#ff385c]" /> Superhost
               </span>
               <span className="text-zinc-300 dark:text-zinc-700">·</span>
               <span className="cursor-pointer font-semibold text-zinc-800 underline dark:text-zinc-200">
                  {formattedLocation}
               </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
               <button
                  onClick={onShare}
                  className="flex items-center gap-2 rounded-lg p-2 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900"
               >
                  <Share className="h-4 w-4 stroke-[2.2]" />
                  <span className="underline">Share</span>
               </button>
               <button
                  onClick={onToggleFavorite}
                  className="flex items-center gap-2 rounded-lg p-2 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900"
               >
                  <Heart
                     className={`h-4 w-4 stroke-[2.2] ${isFavorited ? 'fill-[#ff385c] stroke-[#ff385c]' : ''}`}
                  />
                  <span className="underline">{isFavorited ? 'Saved' : 'Save'}</span>
               </button>
            </div>
         </div>
      </div>
   )
}
