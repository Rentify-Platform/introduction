import * as React from 'react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface VoidPenaltyDialogProps {
   penaltyId: string | null
   isOpen: boolean
   isPending: boolean
   onClose: () => void
   onConfirm: (id: string, reason: string) => void
}

export function VoidPenaltyDialog({
   penaltyId,
   isOpen,
   isPending,
   onClose,
   onConfirm
}: VoidPenaltyDialogProps) {
   const [reason, setReason] = React.useState('')

   if (!penaltyId) return null

   const confirm = () => {
      const trimmed = reason.trim()
      if (trimmed) onConfirm(penaltyId, trimmed)
   }

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Void penalty</DialogTitle>
               <DialogDescription>
                  The penalty will remain in the audit history and stop being active.
               </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
               <Label htmlFor="void-penalty-reason">Reason</Label>
               <Textarea
                  id="void-penalty-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why is this penalty being voided?"
               />
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={onClose} disabled={isPending}>
                  Cancel
               </Button>
               <Button onClick={confirm} disabled={isPending || !reason.trim()}>
                  {isPending ? 'Voiding…' : 'Void penalty'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
