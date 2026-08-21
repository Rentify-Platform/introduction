'use client'

import * as React from 'react'
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
import { Loader2, CheckCircle, User as UserIcon, AlertCircle } from 'lucide-react'
import { KycDocument } from '@/features/kyc/types'
import { formatDate } from '@/lib/utils'

interface KycDocumentsTableProps {
   pendingDocs: KycDocument[]
   isLoading: boolean
   error: unknown
   isUnauthorized: boolean
   onRetry: () => void
   onInspect: (doc: KycDocument) => void
}

export function KycDocumentsTable({
   pendingDocs,
   isLoading,
   error,
   isUnauthorized,
   onRetry,
   onInspect
}: KycDocumentsTableProps) {
   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-2">
            <div>
               <CardTitle className="text-lg text-zinc-900">Identity Verifications</CardTitle>
               <CardDescription className="text-zinc-505">
                  Awaiting administrator manual review
               </CardDescription>
            </div>
            <span className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-xs font-semibold text-pink-600">
               {pendingDocs.length} Pending
            </span>
         </CardHeader>
         <CardContent className="pt-6">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-pink-500" />
                  <p className="text-sm">Loading pending submissions...</p>
               </div>
            ) : error ? (
               <div className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-300" />
                  <p className="text-sm font-medium text-rose-600">
                     {isUnauthorized ? 'Administrator access required' : 'Unable to load KYC queue'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                     {isUnauthorized
                        ? 'Your account cannot access identity reviews.'
                        : 'Check the connection and try again.'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                     Try Again
                  </Button>
               </div>
            ) : pendingDocs.length === 0 ? (
               <div className="py-12 text-center text-zinc-400">
                  <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500/40" />
                  <p className="text-zinc-650 text-sm font-medium">Queue is empty!</p>
                  <p className="mt-1 text-xs text-zinc-400">All submitted profiles are verified.</p>
               </div>
            ) : (
               <Table className="border-zinc-200">
                  <TableHeader className="border-zinc-200">
                     <TableRow className="border-zinc-200 hover:bg-transparent">
                        <TableHead className="text-zinc-550">User ID</TableHead>
                        <TableHead className="text-zinc-550">Doc Type</TableHead>
                        <TableHead className="text-zinc-550">Country</TableHead>
                        <TableHead className="text-zinc-550">Submitted Date</TableHead>
                        <TableHead className="text-zinc-550">Expiration Date</TableHead>
                        <TableHead className="text-zinc-550 text-right">Action</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {pendingDocs.map((doc) => (
                        <TableRow key={doc.id} className="border-zinc-100 hover:bg-zinc-50">
                           <TableCell className="flex items-center gap-2 font-mono text-xs text-zinc-700">
                              <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                              {doc.accountId}
                           </TableCell>
                           <TableCell className="font-semibold text-zinc-900 capitalize">
                              {doc.docType.replace('_', ' ')}
                           </TableCell>
                           <TableCell className="font-mono text-zinc-700">
                              {doc.countryCode || 'N/A'}
                           </TableCell>
                           <TableCell className="text-zinc-500">
                              {formatDate(doc.createdAt)}
                           </TableCell>
                           <TableCell className="text-zinc-500">
                              {formatDate(doc.expiryDate)}
                           </TableCell>
                           <TableCell className="text-right">
                              <Button
                                 size="sm"
                                 onClick={() => onInspect(doc)}
                                 className="border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                              >
                                 Inspect Details
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            )}
         </CardContent>
      </Card>
   )
}
