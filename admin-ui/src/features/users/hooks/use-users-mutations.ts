import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { usersService } from '../services/users-service'
import { usersQueryKeys } from './use-users-queries'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api/api-client'

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
         void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
      },
      onError: (error) => {
         toast.error(
            getApiErrorMessage(error, 'Failed to update account status. Please try again.')
         )
         if ([403, 404, 409].includes(getApiErrorStatus(error) ?? 0)) {
            void queryClient.refetchQueries({ queryKey: usersQueryKeys.all })
         }
      }
   })

   return {
      updateStatus: updateStatusMutation.mutateAsync,
      isUpdatingStatus: updateStatusMutation.isPending
   }
}
