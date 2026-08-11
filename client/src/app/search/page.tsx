'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/navbar'
import { useSearchListings } from '@/features/listings/hooks/use-listings-queries'
import { SearchList } from './components/search-list'
import { SearchMap } from './components/search-map'

function SearchPageContent() {
   const searchParams = useSearchParams()
   const router = useRouter()
   const city = searchParams.get('city') || ''
   const checkIn = searchParams.get('checkIn') || ''
   const checkOut = searchParams.get('checkOut') || ''
   const guests = searchParams.get('guests') || ''

   const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null)
   const [isGeocoding, setIsGeocoding] = React.useState(false)
   const [hoveredPropertyId, setHoveredPropertyId] = React.useState<string | null>(null)

   // 1. Redirect if city is empty
   React.useEffect(() => {
      if (!city) {
         router.replace('/')
      }
   }, [city, router])

   // 2. Geocode the city to get lat/lng coordinates
   React.useEffect(() => {
      if (!city) return

      const geocodeCity = async () => {
         setIsGeocoding(true)
         try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${token}&limit=1`
            const response = await fetch(url)
            const data = await response.json()
            if (data.features && data.features.length > 0) {
               const [lng, lat] = data.features[0].center
               setCoordinates({ lat, lng })
            }
         } catch (err) {
            console.error('Failed to geocode city:', err)
         } finally {
            setIsGeocoding(false)
         }
      }

      geocodeCity()
   }, [city])

   // 3. Query properties within a 50km radius if coordinates are resolved
   const { data, isLoading: isQueryLoading, error } = useSearchListings({
      city: !coordinates ? city : undefined, // fallback to city name filter while geocoding
      latitude: coordinates?.lat,
      longitude: coordinates?.lng,
      radiusKm: 50,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests ? parseInt(guests) : undefined
   })

   const properties = data?.items || []
   const isLoading = isGeocoding || isQueryLoading

   if (!city) return null

   return (
      <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950">
         {/* Navigation header */}
         <Navbar />

         {/* Content body split into 2 sides */}
         <div className="flex flex-1 overflow-hidden">
            {/* Left side: listings list */}
            <div className="w-full lg:w-[58%] h-full overflow-y-auto px-6 py-8 border-r border-zinc-100 dark:border-zinc-900 scrollbar-thin">
               {isLoading ? (
                  <div className="flex flex-col h-full">
                     {/* Skeleton loader */}
                     <div className="animate-pulse space-y-4 mb-6">
                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="animate-pulse space-y-3">
                              <div className="aspect-square w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                              <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                              <div className="h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                           </div>
                        ))}
                     </div>
                  </div>
               ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                     <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Failed to load properties
                     </p>
                     <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Please try again later or check your internet connection.
                     </p>
                  </div>
               ) : (
                  <SearchList
                     properties={properties}
                     city={city}
                     onHoverProperty={setHoveredPropertyId}
                  />
               )}
            </div>

            {/* Right side: map */}
            <div className="hidden lg:block lg:w-[42%] h-full bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-900">
               <SearchMap
                  properties={properties}
                  center={coordinates}
                  hoveredPropertyId={hoveredPropertyId}
               />
            </div>
         </div>
      </div>
   )
}

export default function SearchPage() {
   return (
      <Suspense
         fallback={
            <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff385c]" />
            </div>
         }
      >
         <SearchPageContent />
      </Suspense>
   )
}
