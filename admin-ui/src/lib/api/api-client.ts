import axios from 'axios'
import { useAuthStore } from '@/features/auth/store/use-auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'

export const apiClient = axios.create({
   baseURL: API_URL,
   headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
   }
})

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
   (config) => {
      if (typeof window !== 'undefined') {
         const token = localStorage.getItem('rentify_admin_token')
         if (token) {
            config.headers.Authorization = `Bearer ${token}`
         }
      }
      return config
   },
   (error) => {
      return Promise.reject(error)
   }
)

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
   (response) => response,
   (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
         useAuthStore.getState().clearAuth()
      }
      return Promise.reject(error)
   }
)

export function getApiErrorStatus(error: unknown): number | undefined {
   return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
   if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : fallback
   }

   const payload = error.response?.data as
      { message?: string; error?: { message?: string } } | undefined
   return payload?.message || payload?.error?.message || fallback
}
