'use client'

import { useAuthMutations } from '@/features/auth/hooks/use-auth-mutations'
import { useCurrentUser } from '@/features/auth/hooks/use-auth-queries'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import {
   Bell,
   Compass,
   Globe,
   Heart,
   HelpCircle,
   LogOut,
   Menu,
   MessageSquare,
   PlusCircle,
   Settings,
   User as UserIcon
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { toast } from 'react-hot-toast'

export function Navbar() {
   const { user, isAuthenticated } = useAuthStore()
   const { logout } = useAuthMutations()
   const [isMenuOpen, setIsMenuOpen] = React.useState(false)
   const [activeTab, setActiveTab] = React.useState<'stays' | 'experiences' | 'online'>('stays')
   const menuRef = React.useRef<HTMLDivElement>(null)

   // Trigger fetching user profile if token is available
   useCurrentUser()

   // Close dropdown menu on click outside
   React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false)
         }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
   }, [])

   return (
      <header className="border-zinc-150 sticky top-0 z-45 w-full border-b bg-white dark:border-zinc-900 dark:bg-zinc-950">
         <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-90">
               <span className="text-2xl font-extrabold tracking-tight text-[#ff385c]">
                  Rentify
               </span>
            </Link>

            {/* Navigation Tabs - Stays, Experiences, Online Experiences */}
            <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
               <button
                  type="button"
                  onClick={() => setActiveTab('stays')}
                  className={`relative cursor-pointer py-2 transition-colors ${
                     activeTab === 'stays'
                        ? 'text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
               >
                  Stays
                  {activeTab === 'stays' && (
                     <span className="absolute right-0 bottom-0 left-0 h-[2px] bg-zinc-950 dark:bg-zinc-50" />
                  )}
               </button>
               <button
                  type="button"
                  onClick={() => setActiveTab('experiences')}
                  className={`relative cursor-pointer py-2 transition-colors ${
                     activeTab === 'experiences'
                        ? 'text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
               >
                  Experiences
                  {activeTab === 'experiences' && (
                     <span className="absolute right-0 bottom-0 left-0 h-[2px] bg-zinc-950 dark:bg-zinc-50" />
                  )}
               </button>
               <button
                  type="button"
                  onClick={() => setActiveTab('online')}
                  className={`relative cursor-pointer py-2 transition-colors ${
                     activeTab === 'online'
                        ? 'text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
               >
                  Online Experiences
                  {activeTab === 'online' && (
                     <span className="absolute right-0 bottom-0 left-0 h-[2px] bg-zinc-950 dark:bg-zinc-50" />
                  )}
               </button>
            </nav>

            {/* Right Controls */}
            <div className="relative flex items-center gap-3">
               <Link
                  href="/host"
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
               >
                  Become a Host
               </Link>
               <button
                  type="button"
                  className="hidden rounded-full p-2.5 text-zinc-800 transition-colors hover:bg-zinc-50 sm:block dark:text-zinc-200 dark:hover:bg-zinc-900"
               >
                  <Globe className="h-4.5 w-4.5" />
               </button>

               {/* Dropdown Menu Trigger */}
               <div ref={menuRef} className="relative">
                  <button
                     onClick={() => setIsMenuOpen(!isMenuOpen)}
                     type="button"
                     className="flex cursor-pointer items-center gap-3 rounded-full border border-zinc-200 bg-white py-1.5 pr-2 pl-3.5 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900"
                  >
                     <Menu className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-white select-none">
                        {isAuthenticated && user ? (
                           <span>
                              {(user.firstName?.[0] || '').toUpperCase()}
                              {(user.lastName?.[0] || '').toUpperCase()}
                           </span>
                        ) : (
                           <UserIcon className="h-4 w-4 fill-current stroke-none" />
                        )}
                     </div>
                  </button>

                  {/* Dropdown Menu content */}
                  {isMenuOpen && (
                     <div className="animate-in fade-in-50 slide-in-from-top-2 absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white py-2 text-xs text-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] duration-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                        {isAuthenticated && user ? (
                           <>
                              {/* Section 1: User Actions */}
                              <Link
                                 href="/wishlist"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 font-bold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <Heart className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Wishlists
                              </Link>
                              <Link
                                 href="/trips"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 font-bold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <Compass className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Trips
                              </Link>
                              <Link
                                 href="/messages"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 font-bold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <MessageSquare className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Messages
                              </Link>
                              <Link
                                 href="/profile"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 font-bold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <UserIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Profile
                              </Link>

                              <div className="my-1.5 h-[1px] bg-zinc-100 dark:bg-zinc-800" />

                              {/* Section 2: General settings */}
                              <Link
                                 href="/notifications"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <Bell className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Notifications
                              </Link>
                              <Link
                                 href="/settings"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Account settings
                              </Link>
                              <button
                                 type="button"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <Globe className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Language & currency
                              </button>
                              <Link
                                 href="/help"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <HelpCircle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                 Help center
                              </Link>

                              <div className="my-1.5 h-[1px] bg-zinc-100 dark:bg-zinc-800" />

                              {/* Section 3: Become a Host highlight banner */}
                              <Link
                                 href="/host"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="mx-2 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-950"
                              >
                                 <div>
                                    <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                                       Become a host
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                                       Start hosting and earn money easily.
                                    </p>
                                 </div>
                                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c] dark:bg-rose-950/30">
                                    <PlusCircle className="h-5 w-5" />
                                 </div>
                              </Link>

                              <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

                              {/* Section 5: Logout */}
                              <button
                                 onClick={() => {
                                    logout()
                                    toast.success('Logged out successfully!')
                                    setIsMenuOpen(false)
                                 }}
                                 type="button"
                                 className="hover:text-red-650 flex w-full items-center gap-3 px-4 py-2.5 text-left font-bold text-red-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 <LogOut className="h-4 w-4" />
                                 Log out
                              </button>
                           </>
                        ) : (
                           <>
                              {/* Logged Out Items */}
                              <Link
                                 href="/signup"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="block w-full px-4 py-2.5 text-left font-bold text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                              >
                                 Sign up
                              </Link>
                              <Link
                                 href="/login"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="block w-full px-4 py-2.5 text-left text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                 Log in
                              </Link>

                              <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

                              {/* Become a Host highlight banner for logged out users */}
                              <Link
                                 href="/host"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="mx-2 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-950"
                              >
                                 <div>
                                    <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                                       Become a host
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                                       Start hosting and earn money easily.
                                    </p>
                                 </div>
                                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c] dark:bg-rose-950/30">
                                    <PlusCircle className="h-5 w-5" />
                                 </div>
                              </Link>

                              <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

                              <Link
                                 href="/help"
                                 onClick={() => setIsMenuOpen(false)}
                                 className="block px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                 Help Center
                              </Link>
                           </>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </header>
   )
}
