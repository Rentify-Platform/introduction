'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthModalStore } from '../stores/auth-modal-store'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'
import { SocialAuthButtons } from './social-auth-buttons'

export function AuthModal() {
   const { isOpen, mode, closeModal, setMode } = useAuthModalStore()

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
         <DialogContent className="shadow-airbnb overflow-hidden rounded-2xl bg-white p-0 sm:max-w-[568px] dark:bg-zinc-950">
            {/* Header */}
            <DialogHeader className="border-b border-zinc-200 p-6 pb-4 dark:border-zinc-800">
               <DialogTitle className="text-center text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {mode === 'login' ? 'Log in' : 'Sign up'}
               </DialogTitle>
            </DialogHeader>

            {/* Body */}
            <div className="max-h-[80vh] overflow-y-auto p-6">
               {/* Form Content */}
               {mode === 'login' ? (
                  <LoginForm onSuccess={closeModal} />
               ) : (
                  <SignupForm onSuccess={closeModal} onSwitchToLogin={() => setMode('login')} />
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

               {/* Social Authentication Options */}
               <SocialAuthButtons />

               {/* Switch Mode Footer */}
               <div className="mt-6 border-t border-zinc-200 pt-5 text-center dark:border-zinc-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                     {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                     <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="ml-1.5 cursor-pointer font-semibold text-zinc-900 underline hover:text-zinc-800 hover:no-underline dark:text-zinc-100"
                     >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                     </button>
                  </p>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   )
}
