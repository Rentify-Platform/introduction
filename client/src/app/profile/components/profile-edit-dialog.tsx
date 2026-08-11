'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, ProfileInput } from '@/features/auth/schemas/auth-schema'
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User } from '@/features/auth/types'
import { Loader2 } from 'lucide-react'

interface ProfileEditDialogProps {
   isOpen: boolean
   onClose: () => void
   user: User
   onSave: (data: {
      firstName: string
      lastName: string
      phone: string | null
      bio: string | null
      dateOfBirth: string | null
   }) => Promise<void>
   isSaving: boolean
}

export function ProfileEditDialog({
   isOpen,
   onClose,
   user,
   onSave,
   isSaving
}: ProfileEditDialogProps) {
   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-md dark:bg-zinc-900">
            <DialogHeader>
               <DialogTitle className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  Edit profile details
               </DialogTitle>
            </DialogHeader>

            {isOpen && (
               <ProfileEditFormContent
                  user={user}
                  onSave={onSave}
                  onClose={onClose}
                  isSaving={isSaving}
               />
            )}
         </DialogContent>
      </Dialog>
   )
}

interface ProfileEditFormContentProps {
   user: User
   onSave: (data: {
      firstName: string
      lastName: string
      phone: string | null
      bio: string | null
      dateOfBirth: string | null
   }) => Promise<void>
   onClose: () => void
   isSaving: boolean
}

function ProfileEditFormContent({ user, onSave, onClose, isSaving }: ProfileEditFormContentProps) {
   const form = useForm<ProfileInput>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
         firstName: user.firstName || '',
         lastName: user.lastName || '',
         phone: user.phone || '',
         bio: user.bio || '',
         dateOfBirth: user.dateOfBirth || ''
      }
   })

   const onSubmit = async (data: ProfileInput) => {
      await onSave({
         firstName: data.firstName,
         lastName: data.lastName,
         phone: data.phone || null,
         bio: data.bio || null,
         dateOfBirth: data.dateOfBirth || null
      })
      onClose()
   }

   return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="my-2 space-y-4">
         <div className="grid grid-cols-2 gap-4">
            <Input
               label="First Name"
               placeholder="e.g. John"
               disabled={isSaving}
               error={form.formState.errors.firstName?.message}
               {...form.register('firstName')}
            />
            <Input
               label="Last Name"
               placeholder="e.g. Doe"
               disabled={isSaving}
               error={form.formState.errors.lastName?.message}
               {...form.register('lastName')}
            />
         </div>

         <Input
            label="Phone Number"
            placeholder="e.g. +123456789"
            type="tel"
            disabled={isSaving}
            error={form.formState.errors.phone?.message}
            {...form.register('phone')}
         />

         <Input
            label="Date of Birth"
            type="date"
            disabled={isSaving}
            error={form.formState.errors.dateOfBirth?.message}
            {...form.register('dateOfBirth')}
         />

         <div className="w-full">
            <div className="relative rounded-xl border border-zinc-300 bg-white px-3 py-2 focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-200 dark:focus-within:ring-zinc-200">
               <label className="block text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  About You (Bio)
               </label>
               <textarea
                  placeholder="Share a little bit about yourself, your hobbies, or what you like about hosting/traveling..."
                  className="mt-1 min-h-24 w-full resize-none bg-transparent text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                  disabled={isSaving}
                  {...form.register('bio')}
               />
            </div>
         </div>

         <DialogFooter className="-mx-6 -mb-6 flex gap-3 border-t border-zinc-100 p-4 px-6 pt-4 sm:flex-row sm:justify-end dark:border-zinc-800">
            <Button
               type="button"
               variant="outline"
               onClick={onClose}
               disabled={isSaving}
               className="text-zinc-850 h-10 flex-1 rounded-xl border border-zinc-200 font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
               Cancel
            </Button>
            <Button
               type="submit"
               disabled={isSaving || !form.formState.isValid}
               className="h-10 flex-1 rounded-xl bg-[#ff385c] font-bold text-white hover:bg-[#ff385c]/90"
            >
               {isSaving ? (
                  <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Saving...
                  </>
               ) : (
                  'Save details'
               )}
            </Button>
         </DialogFooter>
      </form>
   )
}
