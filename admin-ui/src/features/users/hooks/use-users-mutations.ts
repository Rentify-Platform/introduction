import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { usersService } from '../services/users-service'
import { usersQueryKeys } from './use-users-queries'

export function useUsersMutations() {
   const queryClient = useQueryClient()

   const updateStatusMutation = useMutation({
      mutationFn: ({
         accountId,
         status
      }: {
         accountId: string
         status: 'active' | 'suspended' | 'banned'
      }) => usersService.updateStatus(accountId, status),
      onSuccess: (_data, variables) => {
         const label =
            variables.status === 'active'
               ? 'reactivated'
               : variables.status === 'suspended'
                 ? 'suspended'
                 : 'banned'
         toast.success(`Account ${label} successfully.`)
         queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
      },
      onError: () => {
         toast.error('Failed to update account status. Please try again.')
      }
   })

   return {
      updateStatus: updateStatusMutation.mutate,
      isUpdatingStatus: updateStatusMutation.isPending
   }
}
