'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/navbar'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useWishlists, useCreateWishlist } from '@/features/wishlist/hooks/use-wishlist'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter
} from '@/components/ui/dialog'
import { Heart, Plus, Loader2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WishlistsPage() {
   const router = useRouter()
   const { isAuthenticated, isInitialized } = useAuthStore()
   const { data: wishlists, isLoading: isWishlistsLoading } = useWishlists(isAuthenticated)
   const createWishlistMutation = useCreateWishlist()

   const [isCreateOpen, setIsCreateOpen] = React.useState(false)
   const [newWishlistName, setNewWishlistName] = React.useState('')

   // Route protection
   React.useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         toast.error('Please log in to view your wishlists.')
         router.push('/')
      }
   }, [isInitialized, isAuthenticated, router])

   if (!isInitialized || isWishlistsLoading) {
      return (
         <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
            <Navbar />
            <div className="flex flex-1 flex-col items-center justify-center font-sans">
               <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
               <p className="mt-4 text-sm text-zinc-500">Loading your wishlists...</p>
            </div>
         </div>
      )
   }

   if (!isAuthenticated) {
      return null
   }

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newWishlistName.trim()) return

      try {
         await createWishlistMutation.mutateAsync({ name: newWishlistName.trim() })
         toast.success('Wishlist created successfully!')
         setNewWishlistName('')
         setIsCreateOpen(false)
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to create wishlist'
         toast.error(msg)
      }
   }

   return (
      <div className="flex min-h-screen flex-col bg-white font-sans antialiased dark:bg-zinc-950">
         <Navbar />

         <main className="flex-1 py-12">
            <div className="mx-auto max-w-[1080px] px-6">
               {/* Page Header */}
               <div className="flex items-center justify-between border-b border-zinc-100 pb-6 dark:border-zinc-900">
                  <div>
                     <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                        Wishlists
                     </h1>
                     <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Collect your favorite places to stay and share them.
                     </p>
                  </div>
                  <Button
                     onClick={() => setIsCreateOpen(true)}
                     className="h-10 gap-1.5 rounded-xl bg-[#ff385c] px-5 font-bold text-white shadow-xs hover:bg-[#ff385c]/90"
                  >
                     <Plus className="h-4 w-4" />
                     Create wishlist
                  </Button>
               </div>

               {/* Wishlist Grid */}
               {wishlists && wishlists.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 md:grid-cols-3">
                     {wishlists.map((wishlist, index) => {
                        const firstItem = wishlist.items[0]
                        const itemCount = wishlist.items.length
                        const formattedDate = new Date(wishlist.createdAt).toLocaleDateString(
                           'en-US',
                           {
                              month: 'short',
                              year: 'numeric'
                           }
                        )

                        return (
                           <Link
                              key={wishlist.id}
                              href={`/wishlist/${wishlist.id}`}
                              className="group flex flex-col hover:opacity-95"
                           >
                              {/* Preview Collage Frame */}
                              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200/50 bg-zinc-50 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                                 {firstItem?.propertyPhotoUrl ? (
                                    <img
                                       src={firstItem.propertyPhotoUrl}
                                       alt={wishlist.name}
                                       loading={index < 4 ? 'eager' : 'lazy'}
                                       className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                                       onError={(e) => {
                                          e.currentTarget.src =
                                             'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'
                                       }}
                                    />
                                 ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                                       <Heart className="h-10 w-10 fill-current" />
                                    </div>
                                 )}
                              </div>

                              {/* Details */}
                              <div className="mt-3 text-sm">
                                 <h3 className="truncate font-extrabold text-zinc-900 dark:text-zinc-100">
                                    {wishlist.name}
                                 </h3>
                                 <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span>
                                       {itemCount} {itemCount === 1 ? 'saved home' : 'saved homes'}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                       <Calendar className="h-3.5 w-3.5" />
                                       Created {formattedDate}
                                    </span>
                                 </div>
                              </div>
                           </Link>
                        )
                     })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                     <div className="dark:border-zinc-850 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-[#ff385c] dark:bg-zinc-900">
                        <Heart className="h-7 w-7 fill-current" />
                     </div>
                     <h3 className="mt-4 text-base font-black text-zinc-900 dark:text-zinc-100">
                        Create your first wishlist
                     </h3>
                     <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        As you search, click the heart icon on properties you like to save them to
                        your wishlists.
                     </p>
                     <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-6 h-10 rounded-xl bg-[#ff385c] font-bold text-white hover:bg-[#ff385c]/90"
                     >
                        Create a wishlist
                     </Button>
                  </div>
               )}
            </div>
         </main>

         {/* Create Wishlist Dialog */}
         <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-md dark:bg-zinc-900">
               <DialogHeader>
                  <DialogTitle className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                     Create wishlist
                  </DialogTitle>
               </DialogHeader>

               <form onSubmit={handleCreate} className="my-2 space-y-4">
                  <Input
                     label="Name"
                     value={newWishlistName}
                     onChange={(e) => setNewWishlistName(e.target.value)}
                     placeholder="e.g. Summer Vacation, Cabin retreats"
                     required
                     maxLength={50}
                     autoFocus
                  />

                  <DialogFooter className="-mx-6 -mb-6 flex gap-3 border-t border-zinc-100 p-4 px-6 pt-4 sm:flex-row sm:justify-end dark:border-zinc-800">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                        disabled={createWishlistMutation.isPending}
                        className="text-zinc-850 h-10 flex-1 rounded-xl border border-zinc-200 font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        disabled={createWishlistMutation.isPending || !newWishlistName.trim()}
                        className="h-10 flex-1 rounded-xl bg-[#ff385c] font-bold text-white hover:bg-[#ff385c]/90"
                     >
                        {createWishlistMutation.isPending ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           'Create'
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </div>
   )
}
