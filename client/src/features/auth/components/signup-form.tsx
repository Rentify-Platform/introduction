'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthMutations } from '../hooks/use-auth-mutations'
import { signupSchema, SignupInput } from '../schemas/auth-schema'

interface SignupFormProps {
   onSuccess: () => void
   onSwitchToLogin?: () => void
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
   const { signup, login, isSigningUp, isLoggingIn } = useAuthMutations()
   const [error, setError] = React.useState<string | null>(null)
   const [success, setSuccess] = React.useState<string | null>(null)

   const form = useForm<SignupInput>({
      resolver: zodResolver(signupSchema),
      defaultValues: {
         firstName: '',
         lastName: '',
         email: '',
         phone: '',
         password: ''
      }
   })

   const onSubmit = async (data: SignupInput) => {
      setError(null)
      try {
         await signup(data)
         toast.success('Account created successfully!')
         setSuccess('Account created successfully! Logging you in...')
         setTimeout(async () => {
            try {
               await login({
                  email: data.email,
                  password: data.password
               })
               toast.success('Logged in successfully!')
               onSuccess()
            } catch {
               setSuccess(null)
               if (onSwitchToLogin) {
                  onSwitchToLogin()
               }
               toast.error('Account created! Please log in with your credentials.')
            }
         }, 1500)
      } catch (err) {
         const errorObj = err as Error
         const msg = errorObj.message || 'Registration failed. That email may be in use.'
         setError(msg)
         toast.error(msg)
      }
   }

   const isLoading = isSigningUp || isLoggingIn

   return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         {error && (
            <div className="text-destructive flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
               <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
               <span>{error}</span>
            </div>
         )}

         {success && (
            <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300">
               <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
               <span>{success}</span>
            </div>
         )}

         <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
               <Input
                  label="First Name"
                  type="text"
                  placeholder="John"
                  disabled={isLoading}
                  icon={<User className="h-4 w-4" />}
                  error={form.formState.errors.firstName?.message}
                  {...form.register('firstName')}
               />
               <Input
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  disabled={isLoading}
                  icon={<User className="h-4 w-4" />}
                  error={form.formState.errors.lastName?.message}
                  {...form.register('lastName')}
               />
            </div>
            <Input
               label="Email"
               type="email"
               placeholder="name@example.com"
               disabled={isLoading}
               icon={<Mail className="h-4 w-4" />}
               error={form.formState.errors.email?.message}
               {...form.register('email')}
            />
            <Input
               label="Phone Number (Optional)"
               type="tel"
               placeholder="+1 (555) 000-0000"
               disabled={isLoading}
               icon={<Phone className="h-4 w-4" />}
               error={form.formState.errors.phone?.message}
               {...form.register('phone')}
            />
            <Input
               label="Password"
               type="password"
               placeholder="At least 6 characters"
               disabled={isLoading}
               icon={<Lock className="h-4 w-4" />}
               error={form.formState.errors.password?.message}
               {...form.register('password')}
            />
         </div>

         <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-[#ff385c] py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[#e00b41] active:scale-[0.98] disabled:opacity-50"
         >
            {isSigningUp ? (
               <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
               </>
            ) : (
               'Agree and continue'
            )}
         </Button>
         <p className="mt-2 px-2 text-center text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
            By selecting Agree and continue, I agree to Rentify&apos;s{' '}
            <span className="cursor-pointer font-semibold text-zinc-800 underline dark:text-zinc-300">
               Terms of Service
            </span>
            ,{' '}
            <span className="cursor-pointer font-semibold text-zinc-800 underline dark:text-zinc-300">
               Privacy Policy
            </span>
            , and{' '}
            <span className="cursor-pointer font-semibold text-zinc-800 underline dark:text-zinc-300">
               Nondiscrimination Policy
            </span>
            .
         </p>
      </form>
   )
}
