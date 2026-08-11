'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthMutations } from '../hooks/use-auth-mutations'
import { loginSchema, LoginInput } from '../schemas/auth-schema'

interface LoginFormProps {
   onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
   const { login, isLoggingIn } = useAuthMutations()
   const [error, setError] = React.useState<string | null>(null)

   const form = useForm<LoginInput>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         email: '',
         password: ''
      }
   })

   const onSubmit = async (data: LoginInput) => {
      setError(null)
      try {
         await login(data)
         toast.success('Logged in successfully!')
         onSuccess()
      } catch (err) {
         const errorObj = err as Error
         const msg = errorObj.message || 'Invalid email or password. Please try again.'
         setError(msg)
         toast.error(msg)
      }
   }

   return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         {error && (
            <div className="text-destructive flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
               <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
               <span>{error}</span>
            </div>
         )}

         <div className="flex flex-col gap-4">
            <Input
               label="Email"
               type="email"
               placeholder="name@example.com"
               disabled={isLoggingIn}
               icon={<Mail className="h-4 w-4" />}
               error={form.formState.errors.email?.message}
               {...form.register('email')}
            />
            <Input
               label="Password"
               type="password"
               placeholder="••••••••"
               disabled={isLoggingIn}
               icon={<Lock className="h-4 w-4" />}
               error={form.formState.errors.password?.message}
               {...form.register('password')}
            />
         </div>

         <Button
            type="submit"
            disabled={isLoggingIn}
            className="h-12 w-full rounded-xl bg-linear-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] py-3.5 text-base font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
         >
            {isLoggingIn ? (
               <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
               </>
            ) : (
               'Continue'
            )}
         </Button>
      </form>
   )
}
