import { useQuery } from '@tanstack/react-query'
import { kycService } from '../services/kyc-service'
import { getApiErrorStatus } from '@/lib/api/api-client'

export const kycQueryKeys = {
   all: ['kyc'] as const,
   pending: () => [...kycQueryKeys.all, 'pending'] as const
}

export function useKycQueries() {
   const pendingDocsQuery = useQuery({
      queryKey: kycQueryKeys.pending(),
      queryFn: () => kycService.getPending()
   })

   return {
      pendingDocs: pendingDocsQuery.data || [],
      isLoading: pendingDocsQuery.isLoading,
      error: pendingDocsQuery.error,
      isUnauthorized: getApiErrorStatus(pendingDocsQuery.error) === 403,
      refetch: pendingDocsQuery.refetch
   }
}
