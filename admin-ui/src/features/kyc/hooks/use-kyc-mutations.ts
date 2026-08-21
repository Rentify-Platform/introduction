import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { kycService } from '../services/kyc-service'
import { kycQueryKeys } from './use-kyc-queries'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api/api-client'

export function useKycMutations(onSuccessCallback?: () => void) {
   const queryClient = useQueryClient()

   const reviewKycMutation = useMutation({
      mutationFn: kycService.review,
      onSuccess: (_data, variables) => {
         toast.success(`KYC document successfully ${variables.action}ed!`)
         void queryClient.invalidateQueries({ queryKey: kycQueryKeys.pending() })
         if (onSuccessCallback) {
            onSuccessCallback()
         }
      },
      onError: (error) => {
         toast.error(getApiErrorMessage(error, 'Failed to submit review. Please try again.'))
         if ([404, 409].includes(getApiErrorStatus(error) ?? 0)) {
            void queryClient.refetchQueries({ queryKey: kycQueryKeys.pending() })
         }
      }
   })

   return {
      reviewKyc: reviewKycMutation.mutateAsync,
      isSubmittingReview: reviewKycMutation.isPending
   }
}
