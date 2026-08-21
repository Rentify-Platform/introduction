import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHosts, toggleSuperhost } from '../services/hosts-service'
import { ToggleSuperhostRequest } from '../types'
import { toast } from 'react-hot-toast'

export function useHostsQuery(page = 1, limit = 20) {
   return useQuery({
      queryKey: ['hosts', page, limit],
      queryFn: () => getHosts(page, limit),
      placeholderData: (prev) => prev
   })
}

export function useHostsMutations() {
   const queryClient = useQueryClient()


   const toggle = useMutation({
      mutationFn: ({ accountId, data }: { accountId: string; data: ToggleSuperhostRequest }) => 
         toggleSuperhost(accountId, data),
      onSuccess: () => {
         toast.success('Superhost status updated successfully')
         queryClient.invalidateQueries({ queryKey: ['hosts'] })
      },
      onError: (error: any) => {
         toast.error(error?.response?.data?.message || 'Failed to update superhost status')
      }
   })

   return {
      toggleSuperhost: toggle.mutate,
      isToggling: toggle.isPending
   }
}
