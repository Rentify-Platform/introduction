'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useListingDetail } from '@/features/listings/hooks/use-listings-queries'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

import { PropertyHeader } from './property-header'
import { PropertyPhotosCollage } from './property-photos-collage'
import { PropertyHostInfo } from './property-host-info'
import { PropertyHighlights } from './property-highlights'
import { PropertyDescription } from './property-description'
import { PropertyAmenities } from './property-amenities'
import { PropertyReviews } from './property-reviews'
import { PropertyBookingCard } from './property-booking-card'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal-store'
import { useWishlists } from '@/features/wishlist/hooks/use-wishlist'
import { SaveToWishlistModal } from '@/features/wishlist/components/save-to-wishlist-modal'

interface PropertyDetailContentProps {
   id: string
}

export function PropertyDetailContent({ id }: PropertyDetailContentProps) {
   const { data, isLoading, error } = useListingDetail(id)
   const { isAuthenticated } = useAuthStore()
   const { openModal } = useAuthModalStore()
   const { data: wishlists } = useWishlists(isAuthenticated)
   const [isWishlistOpen, setIsWishlistOpen] = React.useState(false)

   const isFavorited = React.useMemo(() => {
      if (!wishlists) return false
      return wishlists.some((w) => w.items.some((item) => item.propertyId === id))
   }, [wishlists, id])

   if (isLoading) {
      return (
         <div className="mx-auto w-full max-w-[1120px] animate-pulse px-6 py-6">
            {/* Title Skeleton */}
            <div className="mb-4 h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mb-6 h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />

            {/* Collage Skeleton */}
            <div className="bg-zinc-150 mb-10 grid aspect-[21/9] w-full grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4 dark:bg-zinc-900">
               <div className="h-full bg-zinc-200 md:col-span-2 dark:bg-zinc-800" />
               <div className="grid h-full grid-cols-2 gap-2 md:col-span-2">
                  <div className="bg-zinc-200 dark:bg-zinc-800" />
                  <div className="bg-zinc-200 dark:bg-zinc-800" />
                  <div className="bg-zinc-200 dark:bg-zinc-800" />
                  <div className="bg-zinc-200 dark:bg-zinc-800" />
               </div>
            </div>

            {/* Content Columns Skeleton */}
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
               <div className="space-y-6 md:col-span-2">
                  <div className="h-6 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                     <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                     <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                     <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
               </div>
               <div className="md:col-span-1">
                  <div className="h-[300px] rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50" />
               </div>
            </div>
         </div>
      )
   }

   if (error || !data) {
      return (
         <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-center px-6 py-20 text-center">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
               Listing not found
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
               {"We couldn't retrieve the details for this property."}
            </p>
            <Link href="/" className="mt-6">
               <Button className="btn-primary">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
               </Button>
            </Link>
         </div>
      )
   }

   const { property, reviews, averageRating, totalReviews } = data

   const formattedLocation = `${property.city}, ${property.stateProvince || property.countryCode}`

   const handleShare = () => {
      if (typeof window !== 'undefined') {
         navigator.clipboard.writeText(window.location.href)
         toast.success('Listing URL copied to clipboard!')
      }
   }

   return (
      <main className="mx-auto w-full max-w-[1120px] bg-white px-6 py-6 font-sans dark:bg-zinc-950">
         {/* Back button */}
         <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
         >
            <ArrowLeft className="h-4 w-4" /> Back to all listings
         </Link>

         {/* Header */}
         <PropertyHeader
            title={property.title}
            averageRating={averageRating}
            totalReviews={totalReviews}
            formattedLocation={formattedLocation}
            isFavorited={isFavorited}
            onToggleFavorite={() => {
               if (!isAuthenticated) {
                  openModal()
               } else {
                  setIsWishlistOpen(true)
               }
            }}
            onShare={handleShare}
         />

         {/* 5-Photo Collage */}
         <PropertyPhotosCollage photoUrls={property.photoUrls} title={property.title} />

         {/* Content Columns Layout */}
         <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-3">
            {/* Left Info Column */}
            <div className="space-y-8 text-zinc-900 md:col-span-2 dark:text-zinc-100">
               <PropertyHostInfo
                  roomType={property.roomType}
                  maxGuests={property.maxGuests}
                  bedrooms={property.bedrooms}
                  beds={property.beds}
                  bathrooms={Number(property.bathrooms)}
               />

               <PropertyHighlights roomType={property.roomType} />

               <PropertyDescription description={property.description} />

               <PropertyAmenities amenities={property.amenities} />

               <PropertyReviews
                  reviews={reviews}
                  averageRating={averageRating}
                  totalReviews={totalReviews}
               />
            </div>

            {/* Right Booking Card Column */}
            <div className="md:col-span-1">
               <PropertyBookingCard
                  propertyId={property.id}
                  pricePerNight={property.price}
                  cleaningFeeCents={property.cleaningFeeCents}
                  currency={property.currency}
                  maxGuests={property.maxGuests}
                  averageRating={averageRating}
                  totalReviews={totalReviews}
               />
            </div>
         </div>
         {/* Wishlist Modal */}
         <SaveToWishlistModal
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            propertyId={property.id}
            propertyTitle={property.title}
            propertyPhotoUrl={property.thumbnailUrl || property.photoUrls?.[0]}
         />
      </main>
   )
}
