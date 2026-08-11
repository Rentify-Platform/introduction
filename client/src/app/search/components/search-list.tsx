'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, Tag } from 'lucide-react'
import { Listing } from '@/features/listings/types'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal-store'
import { useWishlists } from '@/features/wishlist/hooks/use-wishlist'
import { SaveToWishlistModal } from '@/features/wishlist/components/save-to-wishlist-modal'
import { formatPrice } from '@/lib/format/price'

interface SearchListProps {
   properties: Listing[]
   city: string
   onHoverProperty: (id: string | null) => void
}

export function SearchList({ properties, city, onHoverProperty }: SearchListProps) {
   const { isAuthenticated } = useAuthStore()
   const { openModal } = useAuthModalStore()
   const { data: wishlists } = useWishlists(isAuthenticated)
   const [wishlistProperty, setWishlistProperty] = React.useState<{
      id: string
      title: string
      photoUrl?: string | null
   } | null>(null)

   return (
      <div className="flex flex-col h-full font-sans">
         {/* Top Header Row with all-fees-included badge */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <div>
               <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight dark:text-zinc-50">
                  Over {properties.length} places in {city}
               </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 shadow-sm">
               <Tag className="h-4 w-4 text-[#ff385c] fill-current" />
               <span>Prices include all fees</span>
            </div>
         </div>

         {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/10">
               <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No properties found within 50km
               </p>
               <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  Try adjusting your search criteria or checking another destination.
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
               {properties.map((property) => {
                  const stableRating =
                     4.5 + (parseInt(property.id.replace(/-/g, '').slice(0, 4), 16) % 50) / 100
                  const reviewsCount = (parseInt(property.id.replace(/-/g, '').slice(4, 6), 16) % 95) + 5
                  const formattedRoomType = property.roomType
                     ? property.roomType
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                     : 'Entire Place'
                  const fallbackImage =
                     'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'

                  // Check if this property qualifies for guest favorite badge (e.g. rating >= 4.75)
                  const isGuestFavorite = stableRating >= 4.75

                  return (
                     <Link
                        key={property.id}
                        href={`/properties/${property.id}`}
                        onMouseEnter={() => onHoverProperty(property.id)}
                        onMouseLeave={() => onHoverProperty(null)}
                        className="group block cursor-pointer"
                     >
                        {/* Photo Frame (aspect 3:2 to match the screenshot) */}
                        <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-sm">
                           <Image
                              src={property.thumbnailUrl || fallbackImage}
                              alt={property.title}
                              fill
                              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                              sizes="(max-w-640px) 100vw, 33vw"
                           />

                           {/* Guest favorite badge */}
                           {isGuestFavorite && (
                              <div className="absolute top-3 left-3 bg-white/95 text-zinc-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md border border-zinc-200/50 z-10 dark:bg-zinc-900/95 dark:text-zinc-50 dark:border-zinc-800">
                                 Guest favorite
                              </div>
                           )}

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
                                 className={`h-5 w-5 stroke-[2] ${
                                    wishlists?.some((w) =>
                                       w.items.some((item) => item.propertyId === property.id)
                                    )
                                       ? 'fill-[#ff385c] stroke-[#ff385c]'
                                       : 'fill-black/30 stroke-white'
                                 }`}
                              />
                           </button>

                           {/* Carousel pagination dots at the bottom center */}
                           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                              <span className="h-1.5 w-1.5 rounded-full bg-white opacity-100"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/60"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/60"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/60"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/60"></span>
                           </div>
                        </div>

                        {/* Property Info */}
                        <div className="space-y-0.5">
                           {/* Location and rating */}
                           <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors truncate">
                                 {formattedRoomType} in {property.city}
                              </h3>
                              <span className="flex shrink-0 items-center gap-1 text-zinc-900 dark:text-zinc-100 text-xs font-semibold">
                                 <Star className="h-3.5 w-3.5 fill-current text-zinc-950 dark:text-zinc-50" />
                                 <span>{stableRating.toFixed(2)} ({reviewsCount})</span>
                              </span>
                           </div>

                           {/* Description snippet */}
                           <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 truncate">
                              {property.title} - {property.description || "A wonderful place for your stay"}
                           </p>

                           {/* Capacity detail */}
                           <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              {property.bedrooms} bedroom{property.bedrooms > 1 ? 's' : ''} · {property.beds} bed{property.beds > 1 ? 's' : ''}
                           </p>

                           {/* Price line with original strike-through and final bold prices */}
                           <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                              <span className="line-through text-zinc-400 mr-1.5 font-normal">
                                 {formatPrice(property.price * 1.15, property.currency).replace(' đ', ' ₫')}
                              </span>
                              <span className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">
                                 {formatPrice(property.price, property.currency).replace(' đ', ' ₫')}
                              </span>
                              <span> night</span>
                           </p>
                        </div>
                     </Link>
                  )
               })}
            </div>
         )}

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
      </div>
   )
}
