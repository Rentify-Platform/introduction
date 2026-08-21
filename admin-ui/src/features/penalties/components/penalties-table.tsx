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
import { Penalty } from '../types'
import { formatVND } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface PenaltiesTableProps {
   penalties: Penalty[]
   onDelete: (id: string) => void
}

export function PenaltiesTable({ penalties, onDelete }: PenaltiesTableProps) {
   return (
      <div className="rounded-md border">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {penalties.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No penalties found
                     </TableCell>
                  </TableRow>
               ) : (
                  penalties.map((p) => (
                     <TableRow key={p.id}>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                           <div>{p.hostName}</div>
                           <div className="text-xs text-muted-foreground">{p.hostEmail}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.bookingId ? `${p.bookingId.split('-')[0]}...` : 'N/A'}</TableCell>
                        <TableCell>{p.penaltyType}</TableCell>
                        <TableCell className="text-destructive font-medium">{formatVND(Number(p.amountCents || 0))}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{p.notes}</TableCell>
                        <TableCell className="text-right">
                           <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => {
                                 if (confirm('Are you sure you want to delete this penalty?')) {
                                    onDelete(p.id)
                                 }
                              }}
                           >
                              <Trash2 className="h-4 w-4" />
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
