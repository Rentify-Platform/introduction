'use client'

import * as React from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditListingFooterProps {
   isPending: boolean
   uploadingPhotos: boolean
   photoCount: number
   onSubmit: (e: React.FormEvent) => void
}

export function EditListingFooter({
   isPending,
   uploadingPhotos,
   photoCount,
   onSubmit
}: EditListingFooterProps) {
   return (
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-zinc-200 bg-white py-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
         <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <span className="text-xs text-zinc-400">
               {photoCount === 0
                  ? 'Please add at least 1 image to save changes.'
                  : 'All changes made are ready to be saved.'}
            </span>
            <div className="flex gap-3">
               <Link href="/hosting">
                  <Button
                     type="button"
                     variant="outline"
                     className="rounded-xl px-5 text-xs font-bold"
                  >
                     Cancel
                  </Button>
               </Link>
               <Button
                  type="button"
                  disabled={isPending || uploadingPhotos}
                  onClick={onSubmit}
                  className="flex items-center gap-1.5 rounded-xl bg-[#ff385c] px-6 py-2.5 text-xs font-extrabold text-white hover:bg-[#e00b41]"
               >
                  {isPending ? (
                     <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                     </>
                  ) : (
                     'Save Changes'
                  )}
               </Button>
            </div>
         </div>
      </div>
   )
}
