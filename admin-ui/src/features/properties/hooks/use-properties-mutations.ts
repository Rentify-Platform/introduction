import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { propertiesService } from '../services/properties-service'
import { propertiesQueryKeys } from './use-properties-queries'

export function usePropertiesMutations() {
   const queryClient = useQueryClient()

   const syncMutation = useMutation({
      mutationFn: propertiesService.syncMeilisearch,
      onSuccess: () => {
         toast.success('Meilisearch index synchronized successfully!')
      },
      onError: () => {
         toast.error('Synchronization failed. Please try again.')
      }
   })

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
         queryClient.invalidateQueries({ queryKey: propertiesQueryKeys.all })
      },
      onError: () => {
         toast.error('Failed to update property status. Please try again.')
      }
   })

   return {
      syncMeilisearch: syncMutation.mutate,
      isSyncing: syncMutation.isPending,
      updateStatus: updateStatusMutation.mutate,
      isUpdatingStatus: updateStatusMutation.isPending
   }
}
