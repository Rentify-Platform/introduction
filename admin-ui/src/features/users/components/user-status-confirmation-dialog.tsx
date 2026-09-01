'use client'

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AccountStatus, UserAccount } from '@/features/users/types'

interface UserStatusConfirmationDialogProps {
   user: UserAccount | null
   targetStatus: AccountStatus | null
   isSubmitting: boolean
   onCancel: () => void
   onConfirm: () => void
}

const STATUS_LABELS: Record<AccountStatus, string> = {
   active: 'Active',
   suspended: 'Suspended',
   banned: 'Banned'
}

export function UserStatusConfirmationDialog({
   user,
   targetStatus,
   isSubmitting,
   onCancel,
   onConfirm
}: UserStatusConfirmationDialogProps) {
   const isOpen = user !== null && targetStatus !== null

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
         <DialogContent showCloseButton={!isSubmitting}>
            <DialogHeader>
               <DialogTitle>Confirm account status change</DialogTitle>
               <DialogDescription>
                  This action updates the persisted Rentify account status.
               </DialogDescription>
            </DialogHeader>
            {user && targetStatus && (
               <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <p className="font-medium text-zinc-900">
                     {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <p className="mt-3 text-zinc-600">
                     {STATUS_LABELS[user.status]} →{' '}
                     <span className="font-semibold text-zinc-900">
                        {STATUS_LABELS[targetStatus]}
                     </span>
                  </p>
               </div>
            )}
            <DialogFooter>
               <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
                  Cancel
               </Button>
               <Button disabled={isSubmitting} onClick={onConfirm}>
                  {isSubmitting ? 'Updating...' : 'Confirm Change'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
