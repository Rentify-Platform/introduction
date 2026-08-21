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
import { usePenaltiesMutations } from '../hooks/use-penalties'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddPenaltyModalProps {
   isOpen: boolean
   onClose: () => void
}

export function AddPenaltyModal({ isOpen, onClose }: AddPenaltyModalProps) {
   const [hostId, setHostId] = React.useState('')
   const [bookingId, setBookingId] = React.useState('')
   const [penaltyType, setPenaltyType] = React.useState('')
   const [amount, setAmount] = React.useState('')
   const [notes, setNotes] = React.useState('')

   const { createPenalty, isCreating } = usePenaltiesMutations()

   const handleSave = () => {
      createPenalty({
         hostId,
         bookingId: bookingId || undefined,
         penaltyType,
         amountCents: Math.round(Number(amount) * 100),
         notes: notes || undefined
      }, {
         onSuccess: () => {
            setHostId('')
            setBookingId('')
            setPenaltyType('')
            setAmount('')
            setNotes('')
            onClose()
         }
      })
   }

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Add Penalty</DialogTitle>
               <DialogDescription>
                  Record a penalty against a host manually.
               </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                  <Label htmlFor="hostId">Host ID</Label>
                  <Input id="hostId" value={hostId} onChange={(e) => setHostId(e.target.value)} />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                  <Input id="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="penaltyType">Penalty Type</Label>
                  <Select onValueChange={(val) => setPenaltyType(val || '')} value={penaltyType}>
                     <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="host_cancellation">Host Cancellation</SelectItem>
                        <SelectItem value="policy_violation">Policy Violation</SelectItem>
                        <SelectItem value="damage">Property Damage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (VND)</Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={onClose}>
                  Cancel
               </Button>
               <Button onClick={handleSave} disabled={isCreating || !hostId || !penaltyType || !amount}>
                  {isCreating ? 'Saving...' : 'Add Penalty'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
