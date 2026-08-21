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

   const { pendingDocs, isLoading, error, isUnauthorized, refetch } = useKycQueries()
   const { reviewKyc, isSubmittingReview } = useKycMutations(() => {
      setSelectedDoc(null)
      setIsRejectDialogOpen(false)
   })

   const handleApprove = async (docId: string) => {
      try {
         await reviewKyc({ documentId: docId, action: 'approve' })
      } catch {
         // The mutation hook displays the backend error and refreshes stale data.
      }
   }

   const handleRejectSubmit = async (data: { rejectionReason: string }) => {
      if (!selectedDoc) return
      try {
         await reviewKyc({
            documentId: selectedDoc.id,
            action: 'reject',
            rejectionReason: data.rejectionReason.trim()
         })
      } catch {
         // The mutation hook displays the backend error and refreshes stale data.
      }
   }

   return (
      <>
         <KycDocumentsTable
            pendingDocs={pendingDocs}
            isLoading={isLoading}
            error={error}
            isUnauthorized={isUnauthorized}
            onRetry={() => void refetch()}
            onInspect={setSelectedDoc}
         />

         {selectedDoc && (
            <KycReviewDialog
               selectedDoc={selectedDoc}
               onClose={() => setSelectedDoc(null)}
               onApprove={(docId) => void handleApprove(docId)}
               onRejectClick={() => setIsRejectDialogOpen(true)}
               isSubmittingReview={isSubmittingReview}
            />
         )}

         {isRejectDialogOpen && selectedDoc && (
            <KycRejectionDialog
               isOpen={isRejectDialogOpen}
               onClose={() => setIsRejectDialogOpen(false)}
               onSubmit={(data) => void handleRejectSubmit(data)}
               isSubmittingReview={isSubmittingReview}
            />
         )}
      </>
   )
}
