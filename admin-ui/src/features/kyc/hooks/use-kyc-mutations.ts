import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { kycService } from '../services/kyc-service'
import { kycQueryKeys } from './use-kyc-queries'

export function useKycMutations(onSuccessCallback?: () => void) {
   const queryClient = useQueryClient()

   const reviewKycMutation = useMutation({
      mutationFn: kycService.review,
      onSuccess: (_data, variables) => {
         toast.success(`KYC document successfully ${variables.action}ed!`)
         queryClient.invalidateQueries({ queryKey: kycQueryKeys.pending() })
         queryClient.invalidateQueries({ queryKey: ['platform-balance'] }) // Invalidate stats just in case
         if (onSuccessCallback) {
            onSuccessCallback()
         }
      },
      onError: () => {
         toast.error('Failed to submit review. Please try again.')
      }
   })

   return {
      reviewKyc: reviewKycMutation.mutate,
      isSubmittingReview: reviewKycMutation.isPending
   }
}
