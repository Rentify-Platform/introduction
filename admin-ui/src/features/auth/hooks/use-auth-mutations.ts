import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth-service'
import { useAuthStore } from '../store/use-auth-store'
import { authQueryKeys } from './use-auth-queries'
import { LoginInput } from '../schemas/auth-schema'
import { AdminAccessDeniedError } from '../types'

export function useAuthMutations() {
   const queryClient = useQueryClient()
   const { setAuth, clearAuth } = useAuthStore()

   const loginMutation = useMutation({
      mutationFn: async (data: LoginInput) => {
         const response = await authService.login(data)
         if (response.success && response.data) {
            if (response.data.user.role !== 'admin') {
               throw new AdminAccessDeniedError()
            }
            return response.data
         }
         throw new Error(response.message || 'Login failed')
      },
      onSuccess: (data) => {
         setAuth(data.accessToken, data.user)
         queryClient.setQueryData(authQueryKeys.currentUser(), data.user)
         queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
      }
   })

   const logoutMutation = useMutation({
      mutationFn: async () => {
         clearAuth()
         queryClient.setQueryData(authQueryKeys.currentUser(), null)
         queryClient.removeQueries({ queryKey: authQueryKeys.all })
      }
   })

   return {
      login: loginMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error,

      logout: logoutMutation.mutateAsync,
      isLoggingOut: logoutMutation.isPending
   }
}
