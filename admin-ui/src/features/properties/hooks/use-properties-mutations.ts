import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { propertiesService } from '../services/properties-service'
import { propertiesQueryKeys } from './use-properties-queries'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api/api-client'

export function usePropertiesMutations() {
   const queryClient = useQueryClient()

   const updateStatusMutation = useMutation({
      mutationFn: ({
         propertyId,
         status
      }: {
         propertyId: string
         status: 'active' | 'paused' | 'archived'
      }) => propertiesService.updateStatus(propertyId, status),
      onSuccess: (_data, variables) => {
         const label =
            variables.status === 'active'
               ? 'activated'
               : variables.status === 'paused'
                 ? 'paused'
                 : 'archived'
         toast.success(`Property ${label} successfully.`)
         void queryClient.invalidateQueries({ queryKey: propertiesQueryKeys.all })
      },
      onError: (error) => {
         toast.error(
            getApiErrorMessage(error, 'Failed to update property status. Please try again.')
         )
         if ([400, 403, 404, 409].includes(getApiErrorStatus(error) ?? 0)) {
            void queryClient.refetchQueries({ queryKey: propertiesQueryKeys.all })
         }
      }
   })

   return {
      updateStatus: updateStatusMutation.mutateAsync,
      isUpdatingStatus: updateStatusMutation.isPending
   }
}
