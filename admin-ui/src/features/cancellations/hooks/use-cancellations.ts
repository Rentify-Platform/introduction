import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCancellations, overrideCancellation } from '../services/cancellations-service'
import { CancellationOverrideRequest } from '../types'
import { toast } from 'react-hot-toast'

export function useCancellationsQuery(page = 1, limit = 20, propertyId?: string) {
   return useQuery({
      queryKey: ['cancellations', page, limit, propertyId],
      queryFn: () => getCancellations(page, limit, propertyId),
      placeholderData: (prev) => prev
   })
}

export function useOverrideCancellationMutation() {
   const queryClient = useQueryClient()


   return useMutation({
      mutationFn: (data: CancellationOverrideRequest) => overrideCancellation(data),
      onSuccess: () => {
         toast.success('Cancellation overridden successfully')
         queryClient.invalidateQueries({ queryKey: ['cancellations'] })
         queryClient.invalidateQueries({ queryKey: ['bookings'] })
      },
      onError: (error: any) => {
         toast.error(error?.response?.data?.message || 'Failed to override cancellation')
      }
   })
}
