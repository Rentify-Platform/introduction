'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Heart, Plus, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal-store'
import {
   useWishlists,
   useCreateWishlist,
   useAddWishlistItem,
   useRemoveWishlistItem
} from '../hooks/use-wishlist'
import toast from 'react-hot-toast'

interface SaveToWishlistModalProps {
   isOpen: boolean
   onClose: () => void
   propertyId: string
   propertyTitle: string
   propertyPhotoUrl?: string | null
}

export function SaveToWishlistModal({
   isOpen,
   onClose,
   propertyId,
   propertyTitle,
   propertyPhotoUrl
}: SaveToWishlistModalProps) {
   const { isAuthenticated } = useAuthStore()
   const { openModal } = useAuthModalStore()
   const { data: wishlists, isLoading: isWishlistsLoading } = useWishlists(
      isAuthenticated && isOpen
   )

   const createWishlistMutation = useCreateWishlist()
   const addWishlistItemMutation = useAddWishlistItem()
   const removeWishlistItemMutation = useRemoveWishlistItem()

   const [newWishlistName, setNewWishlistName] = React.useState('')
   const [showCreateInput, setShowCreateInput] = React.useState(false)

   // If not authenticated, open login and close this
   React.useEffect(() => {
      if (isOpen && !isAuthenticated) {
         onClose()
         openModal()
         toast.error('Please log in to save to wishlists.')
      }
   }, [isOpen, isAuthenticated, onClose, openModal])

   const handleToggleWishlist = async (wishlistId: string, isSaved: boolean) => {
      try {
         if (isSaved) {
            await removeWishlistItemMutation.mutateAsync({ wishlistId, propertyId })
            toast.success('Removed from wishlist!')
         } else {
            await addWishlistItemMutation.mutateAsync({ wishlistId, propertyId })
            toast.success('Saved to wishlist!')
         }
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to update wishlist'
         toast.error(msg)
      }
   }

   const handleCreateAndAdd = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newWishlistName.trim()) return

      try {
         // 1. Create the wishlist
         const newWishlist = await createWishlistMutation.mutateAsync({
            name: newWishlistName.trim()
         })
         // 2. Add the property to the new wishlist
         await addWishlistItemMutation.mutateAsync({
            wishlistId: newWishlist.id,
            propertyId
         })

         toast.success(`Created & saved to ${newWishlist.name}!`)
         setNewWishlistName('')
         setShowCreateInput(false)
         onClose()
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to create wishlist'
         toast.error(msg)
      }
   }

   if (!isAuthenticated) return null

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:max-w-md dark:bg-zinc-900">
            <DialogHeader className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
               <DialogTitle className="line-clamp-1 text-center text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  Save &ldquo;{propertyTitle}&rdquo;
               </DialogTitle>
            </DialogHeader>

            {/* List of Wishlists */}
            <div className="space-y-3 py-4">
               {isWishlistsLoading ? (
                  <div className="flex justify-center py-8">
                     <Loader2 className="h-7 w-7 animate-spin text-[#ff385c]" />
                  </div>
               ) : wishlists && wishlists.length > 0 ? (
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                     {wishlists.map((wishlist) => {
                        const isSaved = wishlist.items.some(
                           (item) => item.propertyId === propertyId
                        )
                        const coverPhoto =
                           wishlist.items[0]?.propertyPhotoUrl ||
                           propertyPhotoUrl ||
                           'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'
                        return (
                           <button
                              key={wishlist.id}
                              onClick={() => handleToggleWishlist(wishlist.id, isSaved)}
                              className="flex w-full items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-3 text-left transition-all hover:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60"
                           >
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                                 <img
                                    src={coverPhoto}
                                    alt={wishlist.name}
                                    className="h-full w-full object-cover"
                                 />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                                    {wishlist.name}
                                 </p>
                                 <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    {wishlist.items.length}{' '}
                                    {wishlist.items.length === 1 ? 'item' : 'items'}
                                 </p>
                              </div>
                              <div className="shrink-0 pr-1">
                                 {isSaved ? (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff385c] text-white">
                                       <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    </div>
                                 ) : (
                                    <Heart className="dark:text-zinc-650 h-5 w-5 text-zinc-300" />
                                 )}
                              </div>
                           </button>
                        )
                     })}
                  </div>
               ) : (
                  <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                     Create your first wishlist below to save this home.
                  </p>
               )}
            </div>

            {/* Create new wishlist action */}
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
               {!showCreateInput ? (
                  <Button
                     onClick={() => setShowCreateInput(true)}
                     className="h-11 w-full gap-2 rounded-2xl border border-zinc-200 bg-white font-extrabold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                     <Plus className="h-4 w-4 text-[#ff385c]" />
                     Create new wishlist
                  </Button>
               ) : (
                  <form onSubmit={handleCreateAndAdd} className="space-y-3">
                     <Input
                        label="Wishlist Name"
                        value={newWishlistName}
                        onChange={(e) => setNewWishlistName(e.target.value)}
                        placeholder="e.g. Dream Trips"
                        required
                        disabled={createWishlistMutation.isPending}
                        autoFocus
                     />
                     <div className="flex gap-2">
                        <Button
                           type="button"
                           variant="outline"
                           onClick={() => setShowCreateInput(false)}
                           disabled={createWishlistMutation.isPending}
                           className="h-10 flex-1 rounded-xl font-bold dark:border-zinc-800"
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
                              'Create & save'
                           )}
                        </Button>
                     </div>
                  </form>
               )}
            </div>
         </DialogContent>
      </Dialog>
   )
}
