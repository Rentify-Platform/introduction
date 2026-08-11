import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
   token: string | null
   user: User | null
   isAuthenticated: boolean
   isLoading: boolean
   isInitialized: boolean
   setAuth: (token: string, user: User) => void
   setUser: (user: User | null) => void
   setLoading: (isLoading: boolean) => void
   clearAuth: () => void
   initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
   token: null,
   user: null,
   isAuthenticated: false,
   isLoading: false,
   isInitialized: false,

   setAuth: (token, user) => {
      if (typeof window !== 'undefined') {
         localStorage.setItem('rentify_admin_token', token)
      }
      set({ token, user, isAuthenticated: true, isLoading: false })
   },

   setUser: (user) => {
      set({ user, isAuthenticated: !!user, isLoading: false })
   },

   setLoading: (isLoading) => {
      set({ isLoading })
   },

   clearAuth: () => {
      if (typeof window !== 'undefined') {
         localStorage.removeItem('rentify_admin_token')
      }
      set({ token: null, user: null, isAuthenticated: false, isLoading: false })
   },

   initialize: () => {
      if (typeof window !== 'undefined') {
         const token = localStorage.getItem('rentify_admin_token')
         if (token) {
            set({ token, isAuthenticated: true, isInitialized: true })
         } else {
            set({ isInitialized: true })
         }
      } else {
         set({ isInitialized: true })
      }
   }
}))
