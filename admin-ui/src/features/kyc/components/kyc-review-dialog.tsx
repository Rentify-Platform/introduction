'use client'

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
import {
   Loader2,
   Calendar,
   FileText,
   User as UserIcon,
   CornerDownRight,
   ExternalLink,
   XCircle,
   CheckCircle,
   AlertCircle
} from 'lucide-react'
import { KycDocument } from '@/features/kyc/types'
import { formatDate } from '@/lib/utils'

interface KycReviewDialogProps {
   selectedDoc: KycDocument
   onClose: () => void
   onApprove: (docId: string) => void
   onRejectClick: () => void
   isSubmittingReview: boolean
}

export function KycReviewDialog({
   selectedDoc,
   onClose,
   onApprove,
   onRejectClick,
   isSubmittingReview
}: KycReviewDialogProps) {
   return (
      <Dialog open={!!selectedDoc} onOpenChange={onClose}>
         <DialogContent className="max-w-3xl border-zinc-200 bg-white text-zinc-900 shadow-2xl">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-xl text-zinc-900">
                  Review Identity Verification
               </DialogTitle>
               <DialogDescription className="text-zinc-505">
                  Inspect the submitted document files and verify details carefully.
               </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
               {/* Metadata Details */}
               <div className="space-y-4">
                  <h4 className="text-pink-650 text-xs font-bold tracking-wider uppercase">
                     Document Information
                  </h4>
                  <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                     <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-zinc-400" />
                        <span className="w-24 font-medium text-zinc-500">Account ID:</span>
                        <span className="truncate font-mono text-zinc-800">
                           {selectedDoc.accountId}
                        </span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <span className="w-24 font-medium text-zinc-500">Doc Type:</span>
                        <span className="font-semibold text-zinc-900 capitalize">
                           {selectedDoc.docType.replace('_', ' ')}
                        </span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-505 w-24 font-medium">Issue Date:</span>
                        <span className="text-zinc-800">{formatDate(selectedDoc.issueDate)}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-505 w-24 font-medium">Expiry Date:</span>
                        <span className="text-zinc-800">{formatDate(selectedDoc.expiryDate)}</span>
                     </div>
                  </div>

                  <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                     <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                     <p>
                        Verify that names match profile registration records, text is clear, and the
                        document is not expired.
                     </p>
                  </div>
               </div>

               {/* Image Attachments */}
               <div className="space-y-4">
                  <h4 className="text-pink-650 text-xs font-bold tracking-wider uppercase">
                     Document Files
                  </h4>
                  <div className="space-y-3">
                     <div>
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-500">
                           <CornerDownRight className="h-3 w-3" /> Front Side File
                        </p>
                        <a
                           href={selectedDoc.fileUrlFront}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300"
                        >
                           <span className="max-w-xs truncate font-mono text-xs text-zinc-500">
                              {selectedDoc.fileUrlFront.split('/').pop()}
                           </span>
                           <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800" />
                        </a>
                     </div>

                     {selectedDoc.fileUrlBack && (
                        <div>
                           <p className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-500">
                              <CornerDownRight className="h-3 w-3" /> Back Side File
                           </p>
                           <a
                              href={selectedDoc.fileUrlBack}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300"
                           >
                              <span className="text-zinc-550 max-w-xs truncate font-mono text-xs">
                                 {selectedDoc.fileUrlBack.split('/').pop()}
                              </span>
                              <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800" />
                           </a>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
               <div className="flex w-full items-center justify-between">
                  <Button
                     variant="ghost"
                     onClick={onClose}
                     className="rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                     Cancel
                  </Button>
                  <div className="flex gap-2">
                     <Button
                        disabled={isSubmittingReview}
                        onClick={onRejectClick}
                        className="rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                     >
                        <XCircle className="mr-1.5 h-4 w-4" /> Reject
                     </Button>
                     <Button
                        disabled={isSubmittingReview}
                        onClick={() => onApprove(selectedDoc.id)}
                        className="rounded-xl bg-linear-to-r from-pink-500 to-rose-500 font-semibold text-white shadow-md shadow-pink-500/10"
                     >
                        {isSubmittingReview ? (
                           <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                           <CheckCircle className="mr-1.5 h-4 w-4" />
                        )}
                        Verify & Approve
                     </Button>
                  </div>
               </div>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
