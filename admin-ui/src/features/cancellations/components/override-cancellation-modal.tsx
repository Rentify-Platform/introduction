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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useOverrideCancellationMutation } from '../hooks/use-cancellations'
import { Cancellation } from '../types'

interface OverrideCancellationModalProps {
   cancellation: Cancellation | null
   isOpen: boolean
   onClose: () => void
}

export function OverrideCancellationModal({
   cancellation,
   isOpen,
   onClose
}: OverrideCancellationModalProps) {
   const [reason, setReason] = React.useState('')
   const [guestRefund, setGuestRefund] = React.useState('')
   const [hostPayout, setHostPayout] = React.useState('')
   const [platformFee, setPlatformFee] = React.useState('')

   const { mutate, isPending } = useOverrideCancellationMutation()

   React.useEffect(() => {
      if (cancellation) {
         setReason(cancellation.overrideReason || '')
         setGuestRefund(cancellation.guestRefundCents ? (Number(cancellation.guestRefundCents) / 100).toString() : '0')
         setHostPayout(cancellation.hostPayoutCents ? (Number(cancellation.hostPayoutCents) / 100).toString() : '0')
         setPlatformFee(cancellation.platformFeeKeptCents ? (Number(cancellation.platformFeeKeptCents) / 100).toString() : '0')
      }
   }, [cancellation])

   if (!cancellation) return null

   const handleSave = () => {
      mutate({
         bookingId: cancellation.bookingId,
         overrideReason: reason,
         guestRefundCents: Math.round(Number(guestRefund) * 100),
         hostPayoutCents: Math.round(Number(hostPayout) * 100),
         platformFeeKeptCents: Math.round(Number(platformFee) * 100)
      }, {
         onSuccess: () => onClose()
      })
   }

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Override Cancellation</DialogTitle>
               <DialogDescription>
                  Modify the refund and payout amounts manually.
               </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Override</Label>
                  <Textarea
                     id="reason"
                     value={reason}
                     onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                     placeholder="e.g. Guest provided medical proof"
                  />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="guestRefund">Guest Refund (VND)</Label>
                  <Input
                     id="guestRefund"
                     type="number"
                     value={guestRefund}
                     onChange={(e) => setGuestRefund(e.target.value)}
                  />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="hostPayout">Host Payout (VND)</Label>
                  <Input
                     id="hostPayout"
                     type="number"
                     value={hostPayout}
                     onChange={(e) => setHostPayout(e.target.value)}
                  />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="platformFee">Platform Fee Kept (VND)</Label>
                  <Input
                     id="platformFee"
                     type="number"
                     value={platformFee}
                     onChange={(e) => setPlatformFee(e.target.value)}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={onClose}>
                  Cancel
               </Button>
               <Button onClick={handleSave} disabled={isPending || !reason}>
                  {isPending ? 'Saving...' : 'Save Override'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
