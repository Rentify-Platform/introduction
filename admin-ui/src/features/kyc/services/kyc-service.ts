import { apiClient } from '@/lib/api/api-client'
import { KycDocument } from '../types'

export const kycService = {
   async getPending(): Promise<KycDocument[]> {
      const response = await apiClient.get('/admin/kyc/pending')
      return response.data?.data || []
   },

   async review(payload: {
      documentId: string
      action: 'approve' | 'reject'
      rejectionReason?: string | null
   }) {
      const response = await apiClient.post(`/admin/kyc/review/${payload.documentId}`, {
         action: payload.action,
         rejectionReason: payload.rejectionReason || null
      })
      return response.data
   }
}
