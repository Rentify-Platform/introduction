'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hostService, RegisterHostInput } from '../services/host-service'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { authQueryKeys } from '@/features/auth/hooks/use-auth-queries'

export function useHostMutations() {
   const queryClient = useQueryClient()
   const { token, setAuth } = useAuthStore()

   const registerHostMutation = useMutation({
      mutationFn: async (input: RegisterHostInput) => {
         const response = await hostService.register(input)
         if (!response.success) {
            throw new Error(response.message || 'Host registration failed')
         }
         return response.data
      },
      onSuccess: async () => {
         const freshUser = await queryClient.fetchQuery({
            queryKey: authQueryKeys.currentUser(),
            staleTime: 0
         })
         if (freshUser && token) {
            setAuth(token, freshUser as Parameters<typeof setAuth>[1])
         }
         queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
      }
   })

   return {
      registerHost: registerHostMutation.mutateAsync,
      isRegistering: registerHostMutation.isPending,
      registerError: registerHostMutation.error
   }
}
