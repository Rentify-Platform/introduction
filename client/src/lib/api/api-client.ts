import axios from 'axios'
import { useAuthStore } from '@/features/auth/stores/auth-store'

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
         const token = localStorage.getItem('rentify_token')
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

// Response interceptor to handle token expiration and revoked sessions
// (account suspended/banned bumps token_version -> old JWT receives 401)
apiClient.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response && error.response.status === 401) {
         if (typeof window !== 'undefined') {
            localStorage.removeItem('rentify_token')
         }
         useAuthStore.getState().clearAuth()
      }

      const backendMessage = error.response?.data?.message
      if (backendMessage) {
         error.message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage
      }

      return Promise.reject(error)
   }
)
