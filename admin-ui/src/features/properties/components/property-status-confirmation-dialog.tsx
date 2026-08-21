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
import { PropertyStatus, PropertySummary } from '@/features/properties/types'

interface PropertyStatusConfirmationDialogProps {
   property: PropertySummary | null
   targetStatus: Extract<PropertyStatus, 'active' | 'paused' | 'archived'> | null
   isSubmitting: boolean
   onCancel: () => void
   onConfirm: () => void
}

export function PropertyStatusConfirmationDialog({
   property,
   targetStatus,
   isSubmitting,
   onCancel,
   onConfirm
}: PropertyStatusConfirmationDialogProps) {
   const isOpen = property !== null && targetStatus !== null

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
         <DialogContent showCloseButton={!isSubmitting}>
            <DialogHeader>
               <DialogTitle>Confirm property status change</DialogTitle>
               <DialogDescription>
                  Activating requires verified host KYC and a verified property license.
               </DialogDescription>
            </DialogHeader>
            {property && targetStatus && (
               <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <p className="font-medium text-zinc-900">{property.title}</p>
                  <p className="text-xs text-zinc-500">
                     {property.city}, {property.countryCode}
                  </p>
                  <p className="mt-3 text-zinc-600 capitalize">
                     {property.status} → <span className="font-semibold">{targetStatus}</span>
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
