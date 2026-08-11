import { AuthCard } from '@/features/auth/components/auth-card'
import { Navbar } from '@/components/shared/navbar'
import { Suspense } from 'react'

export default function SignupPage() {
   return (
      <div className="flex min-h-screen flex-col bg-white font-sans antialiased dark:bg-zinc-950">
         <Navbar />
         <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-900/40">
            <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
               <AuthCard mode="signup" />
            </Suspense>
         </div>
      </div>
   )
}
