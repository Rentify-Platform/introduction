'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const rejectSchema = z.object({
   rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters long')
})

type RejectInput = z.infer<typeof rejectSchema>

interface KycRejectionDialogProps {
   isOpen: boolean
   onClose: () => void
   onSubmit: (payload: { rejectionReason: string }) => void
   isSubmittingReview: boolean
}

export function KycRejectionDialog({
   isOpen,
   onClose,
   onSubmit,
   isSubmittingReview
}: KycRejectionDialogProps) {
   const {
      register,
      handleSubmit,
      reset,
      formState: { errors }
   } = useForm<RejectInput>({
      resolver: zodResolver(rejectSchema),
      defaultValues: {
         rejectionReason: ''
      }
   })

   React.useEffect(() => {
      if (isOpen) {
         reset({ rejectionReason: '' })
      }
   }, [isOpen, reset])

   const onFormSubmit = (data: RejectInput) => {
      onSubmit({ rejectionReason: data.rejectionReason })
   }

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl text-zinc-900">Reject KYC Verification</DialogTitle>
               <DialogDescription className="text-zinc-500">
                  Please provide a clear reason for rejecting this document submission.
               </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="rejectionReason" className="font-medium text-zinc-700">
                     Rejection Reason
                  </Label>
                  <Input
                     id="rejectionReason"
                     placeholder="e.g., Document image is blurry or unreadable"
                     disabled={isSubmittingReview}
                     className="border-zinc-200 bg-white text-zinc-900 focus-visible:border-rose-500"
                     {...register('rejectionReason')}
                  />
                  {errors.rejectionReason && (
                     <p className="text-xs font-medium text-red-500">
                        {errors.rejectionReason.message}
                     </p>
                  )}
               </div>

               <DialogFooter className="pt-2">
                  <div className="flex w-full items-center justify-between">
                     <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                     >
                        Back
                     </Button>
                     <Button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700"
                     >
                        {isSubmittingReview ? (
                           <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                           'Submit Rejection'
                        )}
                     </Button>
                  </div>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   )
}
