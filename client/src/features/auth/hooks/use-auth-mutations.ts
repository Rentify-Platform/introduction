import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth-service'
import { useAuthStore } from '../stores/auth-store'
import { authQueryKeys } from './use-auth-queries'
import { LoginInput, SignupInput } from '../schemas/auth-schema'

export function useAuthMutations() {
   const queryClient = useQueryClient()
   const { token, setAuth, clearAuth } = useAuthStore()

   const loginMutation = useMutation({
      mutationFn: async (data: LoginInput) => {
         const response = await authService.login(data)
         if (response.success && response.data) {
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

   const signupMutation = useMutation({
      mutationFn: async (data: SignupInput) => {
         const formattedData = {
            ...data,
            phone: data.phone || undefined
         }
         const response = await authService.signup(formattedData)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Signup failed')
      }
   })

   const logoutMutation = useMutation({
      mutationFn: async () => {
         // Since logout is client-only (clearing storage), we just execute it
         clearAuth()
         queryClient.setQueryData(authQueryKeys.currentUser(), null)
         queryClient.removeQueries({ queryKey: authQueryKeys.all })
      }
   })

   const updateProfileMutation = useMutation({
      mutationFn: async (data: {
         firstName?: string
         lastName?: string
         phone?: string | null
         bio?: string | null
         avatarUrl?: string | null
         dateOfBirth?: string | null
      }) => {
         const response = await authService.updateProfile(data)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Profile update failed')
      },
      onSuccess: (data) => {
         if (token) {
            setAuth(token, data)
         }
         queryClient.setQueryData(authQueryKeys.currentUser(), data)
         queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
      }
   })

   return {
      login: loginMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error,

      signup: signupMutation.mutateAsync,
      isSigningUp: signupMutation.isPending,
      signupError: signupMutation.error,

      logout: logoutMutation.mutateAsync,
      isLoggingOut: logoutMutation.isPending,

      updateProfile: updateProfileMutation.mutateAsync,
      isUpdatingProfile: updateProfileMutation.isPending,
      updateProfileError: updateProfileMutation.error
   }
}
