import * as React from 'react'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Cancellation } from '../types'
import { formatVND } from '@/lib/utils'

interface CancellationsTableProps {
   cancellations: Cancellation[]
   onOverride: (cancellation: Cancellation) => void
}

export function CancellationsTable({ cancellations, onOverride }: CancellationsTableProps) {
   return (
      <div className="rounded-md border">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Guest Refund</TableHead>
                  <TableHead>Host Payout</TableHead>
                  <TableHead>Override</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {cancellations.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No cancellations found
                     </TableCell>
                  </TableRow>
               ) : (
                  cancellations.map((c) => (
                     <TableRow key={c.id}>
                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{c.bookingId.split('-')[0]}...</TableCell>
                        <TableCell>{c.propertyTitle || 'N/A'}</TableCell>
                        <TableCell>{c.reason}</TableCell>
                        <TableCell>{formatVND(Number(c.guestRefundCents || 0))}</TableCell>
                        <TableCell>{formatVND(Number(c.hostPayoutCents || 0))}</TableCell>
                        <TableCell>{c.overrideReason ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-right">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOverride(c)}
                           >
                              Override
                           </Button>
                        </TableCell>
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>
   )
}
