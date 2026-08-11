'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/navbar'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useWishlistDetails, useRemoveWishlistItem } from '@/features/wishlist/hooks/use-wishlist'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Heart, Loader2, Home } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WishlistDetailPage() {
   const router = useRouter()
   const params = useParams()
   const id = params.id as string

   const { isAuthenticated, isInitialized } = useAuthStore()
   const { data: wishlist, isLoading: isWishlistLoading } = useWishlistDetails(id, isAuthenticated)
   const removeWishlistItemMutation = useRemoveWishlistItem()

   // Route protection
   React.useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         toast.error('Please log in to view this wishlist.')
         router.push('/')
      }
   }, [isInitialized, isAuthenticated, router])

   if (!isInitialized || isWishlistLoading) {
      return (
         <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
            <Navbar />
            <div className="flex flex-1 flex-col items-center justify-center font-sans">
               <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
               <p className="mt-4 text-sm text-zinc-500">Loading wishlist details...</p>
            </div>
         </div>
      )
   }

   if (!isAuthenticated || !wishlist) {
      return null
   }

   const handleRemove = async (e: React.MouseEvent, propertyId: string) => {
      e.preventDefault()
      e.stopPropagation()

      try {
         await removeWishlistItemMutation.mutateAsync({
            wishlistId: wishlist.id,
            propertyId
         })
         toast.success('Removed from wishlist!')
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to remove item'
         toast.error(msg)
      }
   }

   const itemCount = wishlist.items.length

   return (
      <div className="flex min-h-screen flex-col bg-white font-sans antialiased dark:bg-zinc-950">
         <Navbar />

         <main className="flex-1 py-12">
            <div className="mx-auto max-w-[1080px] px-6">
               {/* Back Button & Header */}
               <div className="border-b border-zinc-100 pb-6 dark:border-zinc-900">
                  <Link
                     href="/wishlist"
                     className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                     <ArrowLeft className="h-4 w-4" /> All wishlists
                  </Link>

                  <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                     <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                           {wishlist.name}
                        </h1>
                        <p className="text-zinc-550 mt-1 text-xs dark:text-zinc-400">
                           {itemCount} {itemCount === 1 ? 'home' : 'homes'} saved
                        </p>
                     </div>
                  </div>
               </div>

               {/* Grid items */}
               {itemCount > 0 ? (
                  <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 md:grid-cols-3">
                     {wishlist.items.map((item) => {
                        const price = item.propertyPriceCents
                           ? Number(item.propertyPriceCents) / 100
                           : 0
                        const photoUrl =
                           item.propertyPhotoUrl ||
                           'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'

                        return (
                           <Link
                              key={item.propertyId}
                              href={`/properties/${item.propertyId}`}
                              className="group flex flex-col hover:opacity-95"
                           >
                              {/* Photo collage */}
                              <div className="bg-zinc-150 relative aspect-[4/3] w-full overflow-hidden rounded-2xl dark:bg-zinc-900">
                                 <img
                                    src={photoUrl}
                                    alt={item.propertyTitle}
                                    className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-103"
                                    onError={(e) => {
                                       e.currentTarget.src =
                                          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'
                                    }}
                                 />
                                 {/* Heart Toggle Button */}
                                 <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, item.propertyId)}
                                    className="absolute top-3 right-3 z-10 p-1.5 transition-all hover:scale-110 active:scale-95"
                                 >
                                    <Heart className="h-5 w-5 fill-[#ff385c] stroke-[#ff385c]" />
                                 </button>
                              </div>

                              {/* Info block */}
                              <div className="mt-3 text-xs">
                                 <h3 className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                                    {item.propertyTitle}
                                 </h3>
                                 <p className="dark:text-zinc-155 mt-1 font-bold text-zinc-900">
                                    <span className="font-extrabold">
                                       {price.toLocaleString('vi-VN')} VND
                                    </span>{' '}
                                    <span className="text-zinc-550 font-normal">/ night</span>
                                 </p>
                              </div>
                           </Link>
                        )
                     })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                     <div className="dark:border-zinc-850 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
                        <Home className="h-7 w-7" />
                     </div>
                     <h3 className="mt-4 text-base font-black text-zinc-900 dark:text-zinc-100">
                        No saved homes yet
                     </h3>
                     <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Go back to search and click the heart icon on properties you like to save
                        them.
                     </p>
                     <Link href="/" className="mt-6">
                        <Button className="btn-pill-rausch">Explore properties</Button>
                     </Link>
                  </div>
               )}
            </div>
         </main>
      </div>
   )
}
