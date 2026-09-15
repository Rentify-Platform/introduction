import * as React from 'react'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { HostProfile } from '../types'
import { useHostsMutations } from '../hooks/use-hosts'

interface HostsTableProps {
   hosts: HostProfile[]
}

export function HostsTable({ hosts }: HostsTableProps) {
   const { toggleSuperhost, isToggling } = useHostsMutations()

   return (
      <div className="rounded-md border">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Superhost</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {hosts.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        No hosts found
                     </TableCell>
                  </TableRow>
               ) : (
                  hosts.map((h) => (
                     <TableRow key={h.accountId}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{h.email}</TableCell>
                        <TableCell className="capitalize">
                           {h.kycStatus?.replace('_', ' ')}
                        </TableCell>
                        <TableCell>{h.responseRatePct}%</TableCell>
                        <TableCell>{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="flex justify-end text-right">
                           <Switch
                              checked={h.isSuperhost}
                              disabled={isToggling}
                              onCheckedChange={(checked: boolean) => {
                                 const reason = window.prompt(
                                    `${checked ? 'Enable' : 'Disable'} superhost reason`
                                 )
                                 if (reason?.trim()) {
                                    toggleSuperhost({
                                       accountId: h.accountId,
                                       data: { isSuperhost: checked, reason: reason.trim() }
                                    })
                                 }
                              }}
                           />
                        </TableCell>
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>
   )
}
