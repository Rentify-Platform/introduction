'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useCurrentUser } from '@/features/auth/hooks/use-auth-queries'
import { useAuthMutations } from '@/features/auth/hooks/use-auth-mutations'
import { useHostListings } from '@/features/listings/hooks/use-listings-queries'
import { ProfileCard } from './components/profile-card'
import { ProfileVerifications } from './components/profile-verifications'
import { ProfileListings } from './components/profile-listings'
import { ProfileEditDialog } from './components/profile-edit-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Edit2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
   const router = useRouter()
   const { isAuthenticated, isInitialized } = useAuthStore()
   const { data: user, isLoading: isUserLoading } = useCurrentUser()
   const { updateProfile, isUpdatingProfile } = useAuthMutations()

   const isHost = user?.role === 'host'
   const { data: listings, isLoading: isListingsLoading } = useHostListings(isHost && !!user)

   const [isEditOpen, setIsEditOpen] = React.useState(false)

   // Route protection
   React.useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         toast.error('Please log in to view your profile.')
         router.push('/')
      }
   }, [isInitialized, isAuthenticated, router])

   if (!isInitialized || isUserLoading) {
      return (
         <div className="flex min-h-[70vh] flex-col items-center justify-center font-sans">
            <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
            <p className="mt-4 text-sm text-zinc-500">Loading profile...</p>
         </div>
      )
   }

   if (!user) {
      return null
   }

   const handleAvatarUpdate = async (avatarUrl: string) => {
      try {
         await updateProfile({ avatarUrl })
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to update avatar.'
         toast.error(msg)
      }
   }

   const handleProfileSave = async (data: {
      firstName: string
      lastName: string
      phone: string | null
      bio: string | null
      dateOfBirth: string | null
   }) => {
      try {
         await updateProfile(data)
         toast.success('Profile updated successfully!')
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to update profile.'
         toast.error(msg)
      }
   }

   const memberSince = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
           month: 'long',
           year: 'numeric'
        })
      : 'Recently'

   return (
      <main className="min-h-screen bg-white py-12 font-sans text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
         <div className="mx-auto max-w-[1080px] px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
               {/* Left Column - Profile Summary */}
               <div className="space-y-6 md:col-span-1">
                  <ProfileCard user={user} onAvatarUpdate={handleAvatarUpdate} />
                  <ProfileVerifications user={user} onEditClick={() => setIsEditOpen(true)} />
               </div>

               {/* Right Column - Profile Details */}
               <div className="md:col-span-2">
                  <div className="flex flex-col border-b border-zinc-100 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                     <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                           Hey, I&apos;m {user.firstName}!
                        </h1>
                        <p className="text-zinc-550 mt-2 flex items-center gap-1.5 text-xs font-medium dark:text-zinc-400">
                           <Calendar className="h-4 w-4 text-[#ff385c]" />
                           Member since {memberSince}
                        </p>
                     </div>

                     <Button
                        onClick={() => setIsEditOpen(true)}
                        className="mt-4 h-10 gap-2 rounded-xl border border-zinc-200 bg-white px-5 font-bold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 sm:mt-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                     >
                        <Edit2 className="h-4 w-4 text-zinc-500" />
                        Edit profile
                     </Button>
                  </div>

                  {/* About Section */}
                  <div className="py-6">
                     <h3 className="dark:text-zinc-150 mb-3 text-lg font-black tracking-tight text-zinc-900">
                        About you
                     </h3>
                     {user.bio ? (
                        <p className="text-zinc-650 text-sm leading-relaxed whitespace-pre-wrap dark:text-zinc-400">
                           {user.bio}
                        </p>
                     ) : (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-900 dark:bg-zinc-900/30">
                           <p className="dark:text-zinc-450 text-xs leading-relaxed text-zinc-500">
                              Write a little bio so other hosts or guests can get to know you before
                              you book or host. Share your favorite travel spots, languages, or
                              hobbies!
                           </p>
                           <button
                              type="button"
                              onClick={() => setIsEditOpen(true)}
                              className="mt-2.5 block cursor-pointer border-none bg-transparent p-0 text-xs font-extrabold text-[#ff385c] hover:underline"
                           >
                              Add a bio
                           </button>
                        </div>
                     )}
                  </div>

                  {/* Listings block */}
                  <ProfileListings
                     listings={listings}
                     isLoading={isListingsLoading}
                     isHost={isHost}
                  />
               </div>
            </div>
         </div>

         {/* Edit Profile Dialog */}
         <ProfileEditDialog
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            user={user}
            onSave={handleProfileSave}
            isSaving={isUpdatingProfile}
         />
      </main>
   )
}
