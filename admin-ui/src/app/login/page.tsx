'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle
} from '@/components/ui/card'
import { loginSchema, LoginInput } from '@/features/auth/schemas/auth-schema'
import { useAuthMutations } from '@/features/auth/hooks/use-auth-mutations'
import { useAuthStore } from '@/features/auth/store/use-auth-store'

export default function LoginPage() {
   const router = useRouter()
   const { login, isLoggingIn } = useAuthMutations()
   const { isAuthenticated, user } = useAuthStore()
   const [error, setError] = React.useState<string | null>(null)

   // If already logged in as admin, redirect to dashboard
   React.useEffect(() => {
      if (isAuthenticated && user?.role === 'admin') {
         router.push('/')
      }
   }, [isAuthenticated, user, router])

   const {
      register,
      handleSubmit,
      formState: { errors }
   } = useForm<LoginInput>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         email: '',
         password: ''
      }
   })

   const onSubmit = async (data: LoginInput) => {
      setError(null)
      try {
         const result = await login(data)
         if (result.user.role !== 'admin') {
            setError('Access Denied: Only administrators can access this system.')
            toast.error('Access Denied: Admin role required')
            return
         }
         toast.success('Admin login successful!')
         router.push('/')
      } catch (err) {
         const friendlyMsg = 'Login failed. Please verify credentials.'
         setError(friendlyMsg)
         toast.error(friendlyMsg)
      }
   }

   return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
         {/* Background Glows */}
         <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-pink-500/5 blur-[100px]" />
         <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-rose-500/5 blur-[100px]" />

         <div className="z-10 w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center">
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-tr from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30">
                  <ShieldAlert className="h-6 w-6 text-white" />
               </div>
               <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900">
                  Rentify Admin
               </h2>
               <p className="mt-2 text-sm text-zinc-500">Administrative Control Panel login</p>
            </div>

            <Card className="border-zinc-200 bg-white shadow-xl">
               <CardHeader>
                  <CardTitle className="text-xl text-zinc-900">Sign In</CardTitle>
                  <CardDescription className="text-zinc-500">
                     Enter your administrator credentials to proceed
                  </CardDescription>
               </CardHeader>

               <form onSubmit={handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                     {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
                           <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                           <span>{error}</span>
                        </div>
                     )}

                     <div className="space-y-1.5">
                        <Label htmlFor="email" className="font-medium text-zinc-700">
                           Email Address
                        </Label>
                        <div className="relative">
                           <Mail className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                           <Input
                              id="email"
                              type="email"
                              placeholder="admin@rentify.com"
                              disabled={isLoggingIn}
                              className="h-11 border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-pink-500"
                              {...register('email')}
                           />
                        </div>
                        {errors.email && (
                           <p className="text-[11px] font-medium text-red-500">
                              {errors.email.message}
                           </p>
                        )}
                     </div>

                     <div className="space-y-1.5">
                        <Label htmlFor="password" className="font-medium text-zinc-700">
                           Password
                        </Label>
                        <div className="relative">
                           <Lock className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                           <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              disabled={isLoggingIn}
                              className="h-11 border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-pink-500"
                              {...register('password')}
                           />
                        </div>
                        {errors.password && (
                           <p className="text-[11px] font-medium text-red-500">
                              {errors.password.message}
                           </p>
                        )}
                     </div>
                  </CardContent>

                  <CardFooter className="pt-2">
                     <Button
                        type="submit"
                        disabled={isLoggingIn}
                        className="h-11 w-full rounded-xl bg-linear-to-r from-pink-500 to-rose-500 font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
                     >
                        {isLoggingIn ? (
                           <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Authenticating...
                           </>
                        ) : (
                           'Sign In'
                        )}
                     </Button>
                  </CardFooter>
               </form>
            </Card>
         </div>
      </div>
   )
}
