'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
   LayoutDashboard,
   Users,
   Home as HomeIcon,
   Fingerprint,
   Receipt,
   BookOpen,
   LogOut,
   Loader2,
   ShieldAlert,
   Menu,
   X
} from 'lucide-react'
import { useCurrentUser } from '@/features/auth/hooks/use-auth-queries'
import { useAuthMutations } from '@/features/auth/hooks/use-auth-mutations'
import { useAuthStore } from '@/features/auth/store/use-auth-store'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
   { label: 'Overview', href: '/', icon: LayoutDashboard },
   { label: 'Users', href: '/users', icon: Users },
   { label: 'Properties', href: '/properties', icon: HomeIcon },
   { label: 'KYC Queue', href: '/kyc', icon: Fingerprint },
   { label: 'Bookings', href: '/bookings', icon: BookOpen },
   { label: 'Penalties', href: '/penalties', icon: ShieldAlert },
   { label: 'Ledger', href: '/ledger', icon: Receipt }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
   const router = useRouter()
   const pathname = usePathname()
   const { token, user, isAuthenticated, isInitialized } = useAuthStore()
   const { isLoading } = useCurrentUser()
   const { logout } = useAuthMutations()
   const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

   // Protect Route
   React.useEffect(() => {
      if (isInitialized && !token) {
         router.push('/login')
      }
   }, [isInitialized, token, router])

   // Guard for role
   React.useEffect(() => {
      if (isInitialized && token && user && user.role !== 'admin') {
         router.push('/login')
      }
   }, [isInitialized, token, user, router])

   const handleLogout = async () => {
      await logout()
      router.push('/login')
   }

   // Loading Screen
   if (!isInitialized || (token && isLoading) || !user) {
      return (
         <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-50 text-zinc-900">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <p className="mt-4 text-sm text-zinc-500">Verifying administrator session...</p>
         </div>
      )
   }

   // Check if role matches just in case
   if (user.role !== 'admin') {
      return null
   }

   return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
         {/* Sidebar for Desktop */}
         <aside className="hidden w-64 border-r border-zinc-200 bg-white shadow-xs md:flex md:flex-col">
            <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-tr from-pink-500 to-rose-500 shadow-md shadow-pink-500/20">
                  <ShieldAlert className="h-5 w-5 text-white" />
               </div>
               <span className="text-lg font-bold tracking-tight text-zinc-900">Rentify Admin</span>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
               {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                           isActive
                              ? 'border-l-2 border-pink-500 bg-pink-50 font-semibold text-pink-600'
                              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                     >
                        <Icon className="h-5 w-5" />
                        {item.label}
                     </Link>
                  )
               })}
            </nav>

            <div className="border-t border-zinc-200 p-4">
               <div className="border-zinc-250/60 mb-3 flex items-center gap-3 rounded-xl border bg-zinc-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-zinc-200 text-sm font-semibold text-pink-600 uppercase">
                     {user.firstName[0]}
                     {user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="truncate text-xs font-semibold text-zinc-800">
                        {user.firstName} {user.lastName}
                     </p>
                     <p className="truncate text-[10px] text-zinc-500">{user.email}</p>
                  </div>
               </div>
               <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-zinc-650 w-full justify-start gap-3 rounded-xl hover:bg-rose-50 hover:text-rose-600"
               >
                  <LogOut className="h-5 w-5" />
                  Sign Out
               </Button>
            </div>
         </aside>

         {/* Mobile Menu */}
         {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
               <div
                  className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
                  onClick={() => setMobileMenuOpen(false)}
               />
               <aside className="animate-in slide-in-from-left relative flex w-64 flex-col border-r border-zinc-200 bg-white p-4 duration-200">
                  <div className="flex h-12 items-center justify-between border-b border-zinc-200 pb-2">
                     <span className="font-bold text-zinc-900">Rentify Admin</span>
                     <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-zinc-500 hover:text-zinc-900"
                     >
                        <X className="h-6 w-6" />
                     </button>
                  </div>
                  <nav className="flex-1 space-y-1 py-4">
                     {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                           <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                                 isActive
                                    ? 'border-l-2 border-pink-500 bg-pink-50 text-pink-600'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                              }`}
                           >
                              <Icon className="h-5 w-5" />
                              {item.label}
                           </Link>
                        )
                     })}
                  </nav>
                  <div className="border-t border-zinc-200 pt-4">
                     <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="text-zinc-650 w-full justify-start gap-3 hover:bg-rose-50 hover:text-rose-600"
                     >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                     </Button>
                  </div>
               </aside>
            </div>
         )}

         {/* Main Container */}
         <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-xs md:px-8">
               <div className="flex items-center gap-4">
                  <button
                     onClick={() => setMobileMenuOpen(true)}
                     className="text-zinc-500 hover:text-zinc-900 md:hidden"
                  >
                     <Menu className="h-6 w-6" />
                  </button>
                  <h1 className="text-lg font-semibold text-zinc-900 capitalize">
                     {pathname === '/' ? 'Dashboard Overview' : pathname.replace('/', '')}
                  </h1>
               </div>
               <div className="flex items-center gap-3">
                  <span className="hidden text-xs font-medium text-zinc-400 md:block">
                     System Active
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
               </div>
            </header>

            {/* Content Body */}
            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 md:p-8">{children}</main>
         </div>
      </div>
   )
}
