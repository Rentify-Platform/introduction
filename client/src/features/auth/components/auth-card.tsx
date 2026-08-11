'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'
import { SocialAuthButtons } from './social-auth-buttons'

interface AuthCardProps {
   mode: 'login' | 'signup'
}

export function AuthCard({ mode: initialMode }: AuthCardProps) {
   const router = useRouter()
   const searchParams = useSearchParams()
   const [prevMode, setPrevMode] = React.useState(initialMode)
   const [mode, setMode] = React.useState(initialMode)

   if (initialMode !== prevMode) {
      setPrevMode(initialMode)
      setMode(initialMode)
   }

   const handleSuccess = () => {
      const redirectUrl = searchParams.get('redirect') || '/'
      router.push(redirectUrl)
   }

   return (
      <div className="shadow-airbnb w-full max-w-[568px] overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
         {/* Header */}
         <div className="flex h-16 items-center justify-center border-b border-zinc-200 px-6 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
               {mode === 'login' ? 'Log in' : 'Sign up'}
            </h2>
         </div>

         {/* Body */}
         <div className="p-6">
            {/* Toggle form based on mode */}
            {mode === 'login' ? (
               <LoginForm onSuccess={handleSuccess} />
            ) : (
               <SignupForm onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
            )}

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
               <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
               </div>
               <span className="relative bg-white px-4 text-xs font-normal text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  or
               </span>
            </div>

            {/* Social Buttons */}
            <SocialAuthButtons />

            {/* Switch Mode Footer */}
            <div className="mt-6 border-t border-zinc-200 pt-5 text-center dark:border-zinc-800">
               <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button
                     type="button"
                     onClick={() => {
                        const newMode = mode === 'login' ? 'signup' : 'login'
                        setMode(newMode)
                        router.push(newMode === 'login' ? '/login' : '/signup')
                     }}
                     className="ml-1.5 cursor-pointer font-semibold text-zinc-900 underline hover:text-zinc-800 hover:no-underline dark:text-zinc-100"
                  >
                     {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
               </p>
            </div>
         </div>
      </div>
   )
}
