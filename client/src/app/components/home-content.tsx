'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
   Heart,
   Star,
   Palmtree,
   Home as HomeIcon,
   Waves,
   MountainSnow,
   Box,
   Castle,
   Tent,
   Key,
   Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSearchListings } from '@/features/listings/hooks/use-listings-queries'
import { SearchListingsParams } from '@/features/listings/types'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal-store'
import { useWishlists } from '@/features/wishlist/hooks/use-wishlist'
import { SaveToWishlistModal } from '@/features/wishlist/components/save-to-wishlist-modal'
import { formatPrice } from '@/lib/format/price'

const CATEGORIES = [
   { name: 'Beachfront', icon: Palmtree },
   { name: 'Cabins', icon: HomeIcon },
   { name: 'Amazing Pools', icon: Waves },
   { name: 'Arctic', icon: MountainSnow },
   { name: 'Tiny Homes', icon: Box },
   { name: 'Castles', icon: Castle },
   { name: 'Camping', icon: Tent },
   { name: 'New', icon: Key }
]

export function HomeContent() {
   const router = useRouter()
   const { isAuthenticated } = useAuthStore()
   const { openModal } = useAuthModalStore()
   const { data: wishlists } = useWishlists(isAuthenticated)
   const [wishlistProperty, setWishlistProperty] = React.useState<{
      id: string
      title: string
      photoUrl?: string | null
   } | null>(null)
   const [activeCategory, setActiveCategory] = React.useState<string | null>(null)

   // Interactive search form states
   const [whereInput, setWhereInput] = React.useState('')
   const [checkInInput, setCheckInInput] = React.useState('')
   const [checkOutInput, setCheckOutInput] = React.useState('')
   const [guestsInput, setGuestsInput] = React.useState<number | undefined>(undefined)
   const [searchParams, setSearchParams] = React.useState<SearchListingsParams>({})

   // Fetch properties with search filters using the React Query hook
   const { data, isLoading, error } = useSearchListings({
      query: searchParams.query || activeCategory || undefined,
      city: searchParams.city,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests
   })
   const properties = data?.items || []

   const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const city = whereInput.trim()
      if (!city) return

      const params = new URLSearchParams()
      params.set('city', city)
      if (checkInInput) params.set('checkIn', checkInInput)
      if (checkOutInput) params.set('checkOut', checkOutInput)
      if (guestsInput) params.set('guests', guestsInput.toString())

      router.push(`/search?${params.toString()}`)
   }

   return (
      <main className="flex-1 bg-white dark:bg-zinc-950">
         {/* Row 2: Search Bar Capsule */}
         <div className="flex justify-center border-b border-zinc-100 bg-white px-6 py-6 dark:border-zinc-900 dark:bg-zinc-950">
            <form
               onSubmit={handleSearchSubmit}
               className="shadow-airbnb flex h-16 w-full max-w-[850px] items-center rounded-full border border-zinc-200 bg-white px-2 py-1.5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
               {/* Where */}
               <div className="flex h-full flex-1 flex-col justify-center rounded-full px-5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <label
                     htmlFor="search-where"
                     className="block text-[10px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100"
                  >
                     Where
                  </label>
                  <input
                     id="search-where"
                     type="text"
                     placeholder="Search destinations (e.g. Hanoi)"
                     value={whereInput}
                     onChange={(e) => setWhereInput(e.target.value)}
                     className="w-full bg-transparent text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                  />
               </div>
               <div className="h-8 w-[1px] shrink-0 bg-zinc-200 dark:bg-zinc-800" />

               {/* Check In */}
               <div className="flex h-full flex-1 flex-col justify-center rounded-full px-5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <label
                     htmlFor="search-checkin"
                     className="block text-[10px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100"
                  >
                     Check In
                  </label>
                  <input
                     id="search-checkin"
                     type="date"
                     value={checkInInput}
                     onChange={(e) => setCheckInInput(e.target.value)}
                     className="w-full bg-transparent text-xs font-medium text-zinc-500 focus:outline-none dark:text-zinc-400"
                  />
               </div>
               <div className="h-8 w-[1px] shrink-0 bg-zinc-200 dark:bg-zinc-800" />

               {/* Check Out */}
               <div className="flex h-full flex-1 flex-col justify-center rounded-full px-5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <label
                     htmlFor="search-checkout"
                     className="block text-[10px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100"
                  >
                     Check out
                  </label>
                  <input
                     id="search-checkout"
                     type="date"
                     value={checkOutInput}
                     onChange={(e) => setCheckOutInput(e.target.value)}
                     className="w-full bg-transparent text-xs font-medium text-zinc-500 focus:outline-none dark:text-zinc-400"
                  />
               </div>
               <div className="h-8 w-[1px] shrink-0 bg-zinc-200 dark:bg-zinc-800" />

               {/* Who */}
               <div className="flex h-full flex-1 items-center justify-between rounded-full pr-2 pl-5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <div className="flex flex-1 flex-col justify-center">
                     <label
                        htmlFor="search-guests"
                        className="block text-[10px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100"
                     >
                        Who
                     </label>
                     <input
                        id="search-guests"
                        type="number"
                        min="1"
                        placeholder="Add guests"
                        value={guestsInput || ''}
                        onChange={(e) =>
                           setGuestsInput(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        className="w-full bg-transparent text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                     />
                  </div>
                  <button
                     type="submit"
                     disabled={!whereInput.trim()}
                     className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff385c] text-white transition-colors hover:bg-[#e00b41] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <Search className="h-4 w-4 stroke-[3]" />
                  </button>
               </div>
            </form>
         </div>

         {/* Row 3: Category Icons Bar */}
         <div className="border-b border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-center gap-8 overflow-x-auto px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
               {CATEGORIES.map((category) => {
                  const Icon = category.icon
                  const isActive = category.name === activeCategory
                  return (
                     <button
                        key={category.name}
                        onClick={() =>
                           setActiveCategory((prev) =>
                              prev === category.name ? null : category.name
                           )
                        }
                        className={`flex cursor-pointer flex-col items-center gap-2 border-b-2 pt-4 pb-3 transition-all hover:border-zinc-300 hover:text-zinc-950 dark:hover:border-zinc-700 dark:hover:text-zinc-100 ${
                           isActive
                              ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-100'
                              : 'border-transparent'
                        }`}
                     >
                        <Icon className="h-6 w-6 stroke-[1.8]" />
                        <span className="whitespace-nowrap">{category.name}</span>
                     </button>
                  )
               })}
            </div>
         </div>

         {/* Property Grid Section */}
         <section className="mx-auto max-w-[1280px] px-6 py-14">
            {isLoading ? (
               <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="animate-pulse space-y-3">
                        <div className="aspect-square w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                     </div>
                  ))}
               </div>
            ) : error ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                     Failed to load listings
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Please try again later</p>
               </div>
            ) : properties.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                     No properties found
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                     Try adjusting your filters or checking back later
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {properties.map((property, index) => {
                     // Stable rating from 4.5 to 5.0 using the id
                     const stableRating =
                        4.5 + (parseInt(property.id.replace(/-/g, '').slice(0, 4), 16) % 50) / 100
                     const formattedLocation = `${property.city}, ${property.stateProvince || property.countryCode}`
                     const formattedRoomType = property.roomType
                        ? property.roomType
                             .replace('_', ' ')
                             .replace(/\b\w/g, (l) => l.toUpperCase())
                        : 'Entire Place'
                     const fallbackImage =
                        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'

                     return (
                        <Link
                           key={property.id}
                           href={`/properties/${property.id}`}
                           className="group block cursor-pointer"
                        >
                           {/* Photo Frame */}
                           <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                              <Image
                                 src={property.thumbnailUrl || fallbackImage}
                                 alt={property.title}
                                 fill
                                 priority={index < 4}
                                 loading={index < 4 ? 'eager' : undefined}
                                 className="object-cover transition-transform duration-350 ease-out group-hover:scale-105"
                                 sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                              />

                              {/* Favorite Button */}
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!isAuthenticated) {
                                       openModal()
                                    } else {
                                       setWishlistProperty({
                                          id: property.id,
                                          title: property.title,
                                          photoUrl: property.thumbnailUrl
                                       })
                                    }
                                 }}
                                 className="absolute top-3 right-3 z-10 p-1.5 transition-all hover:scale-110 active:scale-95"
                              >
                                 <Heart
                                    className={`h-6 w-6 stroke-[2] ${
                                       wishlists?.some((w) =>
                                          w.items.some((item) => item.propertyId === property.id)
                                       )
                                          ? 'fill-[#ff385c] stroke-[#ff385c]'
                                          : 'fill-black/30 stroke-white'
                                    }`}
                                 />
                              </button>
                           </div>

                           {/* Property Info */}
                           <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                 <span className="truncate pr-2 font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formattedLocation}
                                 </span>
                                 <span className="flex shrink-0 items-center gap-1 text-zinc-800 dark:text-zinc-200">
                                    <Star className="h-3.5 w-3.5 fill-current text-zinc-900 dark:text-zinc-100" />
                                    <span className="font-medium">{stableRating.toFixed(2)}</span>
                                 </span>
                              </div>
                              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                 {property.title}
                              </p>
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                 {formattedRoomType}
                              </p>
                              <p className="pt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                 <span className="font-bold">
                                    {formatPrice(property.price, property.currency)}
                                 </span>{' '}
                                 / night
                              </p>
                           </div>
                        </Link>
                     )
                  })}
               </div>
            )}

            {/* Show More Button */}
            <div className="mt-12 flex justify-center">
               <button
                  type="button"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
               >
                  Show more
               </button>
            </div>
         </section>

         {/* Experience True Hospitality Section */}
         <section className="border-t border-zinc-100 bg-[#f7f7f7] px-6 py-16 dark:border-zinc-900 dark:bg-zinc-950/10">
            <div className="mx-auto max-w-[1280px]">
               <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                  {/* Left content */}
                  <div className="space-y-6 text-left">
                     <h2 className="text-4xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
                        Experience True
                        <br />
                        Hospitality
                     </h2>
                     <p className="max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
                        Discover homes that are more than just a place to stay. Belong anywhere in
                        the world, with hosts who care about the details.
                     </p>
                     <Button className="h-12 rounded-lg bg-[#c13515] px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#a82a0f] active:scale-[0.98]">
                        Explore Host Stories
                     </Button>
                  </div>

                  {/* Right photo */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg">
                     <Image
                        src="/host-stories.jpg"
                        alt="Woman standing in a bright minimalist living room with houseplants"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        loading="eager"
                     />
                  </div>
               </div>
            </div>
         </section>

         {/* Wishlist Modal */}
         {wishlistProperty && (
            <SaveToWishlistModal
               isOpen={!!wishlistProperty}
               onClose={() => setWishlistProperty(null)}
               propertyId={wishlistProperty.id}
               propertyTitle={wishlistProperty.title}
               propertyPhotoUrl={wishlistProperty.photoUrl}
            />
         )}
      </main>
   )
}
