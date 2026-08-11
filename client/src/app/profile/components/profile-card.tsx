'use client'

import * as React from 'react'
import { Camera, ShieldCheck, Loader2 } from 'lucide-react'
import { useUpload } from '@/hooks/use-upload'
import { User } from '@/features/auth/types'
import toast from 'react-hot-toast'

interface ProfileCardProps {
   user: User
   onAvatarUpdate: (url: string) => Promise<void>
}

export function ProfileCard({ user, onAvatarUpdate }: ProfileCardProps) {
   const { uploadFile, isUploading } = useUpload()
   const fileInputRef = React.useRef<HTMLInputElement>(null)

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      try {
         const url = await uploadFile(files[0])
         await onAvatarUpdate(url)
         toast.success('Profile picture updated successfully!')
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to upload profile picture.'
         toast.error(msg)
      }
   }

   const triggerFileInput = () => {
      fileInputRef.current?.click()
   }

   const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

   // Calculate years on Rentify
   const createdDate = user.createdAt ? new Date(user.createdAt) : new Date()
   const currentYear = new Date().getFullYear()
   const signupYear = createdDate.getFullYear()
   const yearsOnRentify = Math.max(1, currentYear - signupYear + 1)

   return (
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
         <div className="flex flex-col items-center text-center">
            {/* Avatar section */}
            <div className="group relative mb-4">
               <div className="text-zinc-550 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-zinc-100 bg-zinc-100 text-3xl font-extrabold shadow-inner select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {user.avatarUrl ? (
                     <img
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-full w-full object-cover"
                     />
                  ) : (
                     <span>{initials || '?'}</span>
                  )}
               </div>

               {/* Upload overlay */}
               <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
               >
                  {isUploading ? (
                     <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                     <>
                        <Camera className="h-6 w-6 text-white" />
                        <span className="mt-1 text-[10px] font-bold tracking-wide text-white uppercase">
                           Add photo
                        </span>
                     </>
                  )}
               </button>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
               />
            </div>

            {/* Name and role */}
            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
               {user.firstName} {user.lastName}
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
               <span className="text-zinc-650 inline-flex items-center rounded-full border border-zinc-200/50 bg-zinc-100 px-2.5 py-0.5 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {user.role === 'host' ? 'Host' : 'Guest'}
               </span>
               {user.guestKycStatus === 'verified' && (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
                     <ShieldCheck className="h-3.5 w-3.5" />
                     Verified
                  </span>
               )}
            </div>

            {/* Divider */}
            <div className="my-5 h-[1px] w-full bg-zinc-100 dark:bg-zinc-800" />

            {/* stats */}
            <div className="flex w-full justify-around text-left">
               <div>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                     {yearsOnRentify}
                  </p>
                  <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                     Years on Rentify
                  </p>
               </div>
               <div className="border-r border-zinc-100 dark:border-zinc-800" />
               <div>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">0</p>
                  <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                     Reviews
                  </p>
               </div>
            </div>
         </div>
      </div>
   )
}
