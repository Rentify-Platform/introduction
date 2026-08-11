'use client'

import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function Providers({ children }: { children: React.ReactNode }) {
   const [queryClient] = useState(
      () =>
         new QueryClient({
            defaultOptions: {
               queries: {
                  refetchOnWindowFocus: false,
                  retry: false
               }
            }
         })
   )

   const initializeAuth = useAuthStore((state) => state.initialize)

   useEffect(() => {
      initializeAuth()
   }, [initializeAuth])

   return (
      <QueryClientProvider client={queryClient}>
         {children}
         <Toaster position="top-right" reverseOrder={false} />
      </QueryClientProvider>
   )
}
