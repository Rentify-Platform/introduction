'use client'

import * as React from 'react'
import { useKycQueries } from '@/features/kyc/hooks/use-kyc-queries'
import { useKycMutations } from '@/features/kyc/hooks/use-kyc-mutations'
import { KycDocument } from '@/features/kyc/types'
import { KycDocumentsTable } from '@/features/kyc/components/kyc-documents-table'
import { KycReviewDialog } from '@/features/kyc/components/kyc-review-dialog'
import { KycRejectionDialog } from '@/features/kyc/components/kyc-rejection-dialog'

export function KycQueueContainer() {
   const [selectedDoc, setSelectedDoc] = React.useState<KycDocument | null>(null)
   const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false)

   const { pendingDocs, isLoading, error } = useKycQueries()
   const { reviewKyc, isSubmittingReview } = useKycMutations(() => {
      setSelectedDoc(null)
      setIsRejectDialogOpen(false)
   })

   const handleApprove = (docId: string) => {
      reviewKyc({ documentId: docId, action: 'approve' })
   }

   const handleRejectSubmit = (data: { rejectionReason: string }) => {
      if (!selectedDoc) return
      reviewKyc({
         documentId: selectedDoc.id,
         action: 'reject',
         rejectionReason: data.rejectionReason
      })
   }

   return (
      <>
         <KycDocumentsTable
            pendingDocs={pendingDocs}
            isLoading={isLoading}
            error={error}
            onInspect={setSelectedDoc}
         />

         {selectedDoc && (
            <KycReviewDialog
               selectedDoc={selectedDoc}
               onClose={() => setSelectedDoc(null)}
               onApprove={handleApprove}
               onRejectClick={() => setIsRejectDialogOpen(true)}
               isSubmittingReview={isSubmittingReview}
            />
         )}

         {isRejectDialogOpen && selectedDoc && (
            <KycRejectionDialog
               isOpen={isRejectDialogOpen}
               onClose={() => setIsRejectDialogOpen(false)}
               onSubmit={handleRejectSubmit}
               isSubmittingReview={isSubmittingReview}
            />
         )}
      </>
   )
}
