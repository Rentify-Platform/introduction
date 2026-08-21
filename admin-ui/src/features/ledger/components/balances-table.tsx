'use client'

import * as React from 'react'
import { Wallet, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { LedgerBalance, LedgerOwnerType } from '@/features/ledger/types'
import { cn, formatDate, formatVND } from '@/lib/utils'

const OWNER_LABELS: Record<LedgerOwnerType, string> = {
   platform: 'Platform',
   host: 'Host',
   guest: 'Guest',
   tax_authority: 'Tax Authority'
}

const OWNER_CLASSES: Record<LedgerOwnerType, string> = {
   platform: 'bg-pink-50 text-pink-700 border border-pink-200',
   host: 'bg-sky-50 text-sky-700 border border-sky-200',
   guest: 'bg-violet-50 text-violet-700 border border-violet-200',
   tax_authority: 'bg-amber-50 text-amber-700 border border-amber-200'
}

interface BalancesTableProps {
   balances: LedgerBalance[]
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onRefetch: () => void
}

export function BalancesTable({
   balances,
   isLoading,
   isFetching,
   error,
   onRefetch
}: BalancesTableProps) {
   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="text-lg text-zinc-900">Account Balances</CardTitle>
               <CardDescription className="text-zinc-500">
                  {balances.length > 0
                     ? `${balances.length} ledger accounts`
                     : 'No ledger accounts registered'}
               </CardDescription>
            </div>
            <Button
               id="balances-refresh"
               variant="outline"
               size="sm"
               className="h-8 gap-1.5 border-zinc-200 text-xs text-zinc-600"
               disabled={isFetching}
               onClick={onRefetch}
            >
               <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
               Refresh
            </Button>
         </CardHeader>

         <CardContent className="p-0">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading balances…</p>
               </div>
            ) : error || balances.length === 0 ? (
               <div className="py-16 text-center">
                  <Wallet className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No balances found</p>
                  <p className="mt-1 text-xs text-zinc-400">
                     {error ? 'Failed to load data.' : 'Ledger accounts appear after transactions.'}
                  </p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                        <TableRow className="border-zinc-200 hover:bg-transparent">
                           <TableHead className="text-zinc-500">Owner</TableHead>
                           <TableHead className="text-zinc-500">Owner Type</TableHead>
                           <TableHead className="text-zinc-500">Subtype</TableHead>
                           <TableHead className="text-zinc-500">Currency</TableHead>
                           <TableHead className="text-right text-zinc-500">Balance</TableHead>
                           <TableHead className="text-zinc-500">Updated</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {balances.map((balance) => (
                           <TableRow
                              key={balance.ledgerAccountId}
                              className="border-zinc-100 hover:bg-zinc-50/50"
                           >
                              <TableCell>
                                 <p className="text-sm font-medium text-zinc-900">
                                    {balance.ownerName ||
                                       (balance.ownerType === 'platform'
                                          ? 'Rentify Platform'
                                          : truncateId(balance.ownerAccountId ?? ''))}
                                 </p>
                                 {balance.ownerEmail && (
                                    <p className="truncate font-mono text-xs text-zinc-400">
                                       {balance.ownerEmail}
                                    </p>
                                 )}
                              </TableCell>
                              <TableCell>
                                 <span
                                    className={cn(
                                       'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                                       OWNER_CLASSES[balance.ownerType] ??
                                          'border border-zinc-200 bg-zinc-100 text-zinc-700'
                                    )}
                                 >
                                    {OWNER_LABELS[balance.ownerType] ?? balance.ownerType}
                                 </span>
                              </TableCell>
                              <TableCell className="text-xs text-zinc-500">
                                 {balance.accountSubtype}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-zinc-500">
                                 {balance.currency}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium text-zinc-900">
                                 {formatVND(Number(balance.balanceCents))}
                              </TableCell>
                              <TableCell className="text-xs text-zinc-500">
                                 {formatDate(balance.updatedAt)}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>
            )}
         </CardContent>
      </Card>
   )
}

function truncateId(id: string) {
   if (!id) return '—'
   return `${id.slice(0, 8)}…`
}
