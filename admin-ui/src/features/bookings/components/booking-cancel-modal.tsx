import * as React from 'react'
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface BookingCancelModalProps {
   bookingId: string | null
   isOpen: boolean
   isPending: boolean
   onClose: () => void
   onConfirm: (bookingId: string, reason?: string) => void
}

export function BookingCancelModal({
   bookingId,
   isOpen,
   isPending,
   onClose,
   onConfirm
}: BookingCancelModalProps) {
   // State khởi tạo rỗng mỗi lần mount — container remount modal qua `key`
   // theo bookingId nên reason luôn sạch khi mở lại, không cần effect.
   const [reason, setReason] = React.useState('')

   const handleConfirm = () => {
      if (!bookingId) return
      onConfirm(bookingId, reason.trim() || undefined)
   }

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Cancel Booking</DialogTitle>
               <DialogDescription>
                  The booking will be marked as cancelled by admin. This cannot be undone.
               </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                  <Label htmlFor="booking-cancel-reason">Reason (optional)</Label>
                  <Textarea
                     id="booking-cancel-reason"
                     value={reason}
                     onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setReason(e.target.value)
                     }
                     placeholder="e.g. Property removed from platform"
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={onClose} disabled={isPending}>
                  Keep Booking
               </Button>
               <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="bg-rose-600 text-white hover:bg-rose-700"
               >
                  {isPending ? 'Cancelling…' : 'Cancel Booking'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
