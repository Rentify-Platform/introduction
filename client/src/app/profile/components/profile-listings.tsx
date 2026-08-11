'use client'

import * as React from 'react'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Listing } from '@/features/listings/types'
import { Button } from '@/components/ui/button'

interface ProfileListingsProps {
   listings: Listing[] | undefined
   isLoading: boolean
   isHost: boolean
}

export function ProfileListings({ listings, isLoading, isHost }: ProfileListingsProps) {
   if (!isHost) return null

   if (isLoading) {
      return (
         <div className="mt-8 space-y-4">
            <h3 className="dark:text-zinc-150 text-base font-black tracking-tight text-zinc-900">
               Your Listings
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
               {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                     <div className="aspect-[4/3] rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                     <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                     <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
               ))}
            </div>
         </div>
      )
   }

   const activeListings = listings?.filter((l) => l.status === 'active') || []

   return (
      <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
         <div className="mb-5 flex items-center justify-between">
            <div>
               <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  Your active listings
               </h3>
               <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  These properties are visible to guests on the marketplace.
               </p>
            </div>
            <Link href="/hosting/create">
               <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border border-zinc-200 bg-white font-bold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
               >
                  <PlusCircle className="h-4 w-4 text-[#ff385c]" />
                  Create listing
               </Button>
            </Link>
         </div>

         {activeListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You don&apos;t have any active listings.
               </p>
               <Link href="/hosting/create" className="mt-3 inline-block">
                  <Button size="sm" className="btn-pill-rausch">
                     Create a listing draft
                  </Button>
               </Link>
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
               {activeListings.map((listing, index) => {
                  const displayPrice = listing.price || Number(listing.basePriceCents) / 100
                  const displayPhoto =
                     listing.thumbnailUrl ||
                     listing.photoUrls?.[0] ||
                     '/images/property-placeholder.jpg'
                  return (
                     <Link
                        key={listing.id}
                        href={`/properties/${listing.id}`}
                        className="group flex flex-col hover:opacity-95"
                     >
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                           <img
                              src={displayPhoto}
                              alt={listing.title}
                              loading={index < 4 ? 'eager' : 'lazy'}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                 e.currentTarget.src =
                                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'
                              }}
                           />
                        </div>
                        <div className="mt-2 text-xs">
                           <h4 className="line-clamp-1 font-extrabold text-zinc-900 dark:text-zinc-200">
                              {listing.title}
                           </h4>
                           <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{listing.city}</p>
                           <p className="dark:text-zinc-155 mt-1 font-bold text-zinc-900">
                              <span className="font-extrabold">
                                 {displayPrice.toLocaleString('vi-VN')} VND
                              </span>{' '}
                              <span className="text-zinc-550 font-normal">/ night</span>
                           </p>
                        </div>
                     </Link>
                  )
               })}
            </div>
         )}
      </div>
   )
}
