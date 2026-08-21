import { useQuery } from '@tanstack/react-query'
import { authService } from '../services/auth-service'
import { useAuthStore } from '../store/use-auth-store'
import { getApiErrorStatus } from '@/lib/api/api-client'

export const authQueryKeys = {
   all: ['auth'] as const,
   currentUser: () => [...authQueryKeys.all, 'currentUser'] as const
}

export function useCurrentUser() {
   const { token, setUser, clearAuth } = useAuthStore()

   return useQuery({
      queryKey: authQueryKeys.currentUser(),
      queryFn: async () => {
         try {
            const response = await authService.getMe()
            if (response.success && response.data) {
               setUser(response.data)
               return response.data
            }
            throw new Error(response.message || 'Failed to fetch user profile')
         } catch (error) {
            if (getApiErrorStatus(error) === 401) {
               clearAuth()
            }
            throw error
         }
      },
      enabled: !!token,
      retry: false,
      staleTime: 1000 * 60 * 5 // 5 minutes stale time
   })
}
