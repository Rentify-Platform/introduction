'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, Calendar, Users, Check, X, AlertCircle, Inbox } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { Button } from '@/components/ui/button'
import { useHostBookings } from '@/features/bookings/hooks/use-bookings-queries'
import { useApproveBooking, useDeclineBooking } from '@/features/bookings/hooks/use-bookings-mutations'
import { formatDate } from '@/lib/format/date'
import { formatPrice } from '@/lib/format/price'
import toast from 'react-hot-toast'
import Image from 'next/image'

type ReservationTabKey = 'all' | 'pending_approval' | 'confirmed' | 'completed' | 'cancelled'

const TABS: { key: ReservationTabKey; label: string }[] = [
   { key: 'all', label: 'All' },
   { key: 'pending_approval', label: 'Pending Approval' },
   { key: 'confirmed', label: 'Confirmed' },
   { key: 'completed', label: 'Completed' },
   { key: 'cancelled', label: 'Cancelled & Expired' }
]

export default function HostReservationsPage() {
   const router = useRouter()
   const { isAuthenticated, user, isInitialized } = useAuthStore()

   const { data: bookings = [], isLoading, isError, refetch } = useHostBookings()
   const approveMutation = useApproveBooking()
   const declineMutation = useDeclineBooking()

   const [activeTab, setActiveTab] = React.useState<ReservationTabKey>('all')

   // Protect page
   React.useEffect(() => {
      if (isInitialized) {
         if (!isAuthenticated) {
            toast.error('Please log in to manage your reservations.')
            router.push('/login?redirect=/hosting/reservations')
         } else if (user?.role !== 'host') {
            toast.error('Please complete host onboarding first.')
            router.push('/host')
         }
      }
   }, [isInitialized, isAuthenticated, user, router])

   const handleApprove = async (id: string) => {
      const confirmApprove = window.confirm('Are you sure you want to approve this reservation request?')
      if (!confirmApprove) return

      try {
         await approveMutation.mutateAsync(id)
         toast.success('Reservation request approved successfully!')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to approve reservation')
      }
   }

   const handleDecline = async (id: string) => {
      const reason = window.prompt('Enter decline reason (optional):')
      if (reason === null) return // Canceled prompt

      try {
         await declineMutation.mutateAsync({ id, reason: reason || undefined })
         toast.success('Reservation request declined successfully!')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to decline reservation')
      }
   }

   if (!isInitialized || isLoading) {
      return (
         <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f7f7] font-sans">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff385c]" />
            <p className="text-sm font-medium text-zinc-400">Loading reservations…</p>
         </div>
      )
   }

   if (!isAuthenticated || !user) return null

   // Filter bookings
   const filteredBookings = bookings.filter((b) => {
      if (activeTab === 'all') return true
      if (activeTab === 'cancelled') {
         return b.status.startsWith('cancelled') || b.status === 'expired'
      }
      return b.status === activeTab
   })

   const getStatusLabel = (status: string) => {
      switch (status) {
         case 'pending':
            return 'Pending Payment'
         case 'pending_approval':
            return 'Pending Approval'
         case 'confirmed':
            return 'Confirmed'
         case 'completed':
            return 'Completed'
         case 'cancelled_by_guest':
            return 'Cancelled by Guest'
         case 'cancelled_by_host':
            return 'Declined/Cancelled by Host'
         case 'expired':
            return 'Expired'
         default:
            return status
      }
   }

   const getStatusStyles = (status: string) => {
      switch (status) {
         case 'confirmed':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
         case 'pending_approval':
            return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50'
         case 'pending':
            return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
         case 'completed':
            return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
         default:
            return 'bg-zinc-50 text-zinc-500 border-zinc-150 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800'
      }
   }

   return (
      <div className="min-h-screen bg-[#f7f7f7] font-sans">
         <title>Host Reservations - Rentify</title>

         {/* ── Top bar ── */}
         <header className="sticky top-0 z-30 border-b border-[#ebebeb] bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
               {/* Left — logo + breadcrumb */}
               <div className="flex items-center gap-3 min-w-0">
                  <Link
                     href="/"
                     className="flex shrink-0 items-center gap-1.5 text-[#ff385c] transition-opacity hover:opacity-70"
                     title="Back to homepage"
                  >
                     <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current" aria-hidden="true">
                        <path d="M16 1C10.5 1 5.3 5.2 5.3 11.3c0 7.4 9.3 18.2 10.1 19.1.2.3.5.4.6.4s.4-.1.6-.4C17.4 29.5 26.7 18.7 26.7 11.3 26.7 5.2 21.5 1 16 1zm0 15c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                     </svg>
                     <span className="text-base font-black tracking-tight">rentify</span>
                  </Link>

                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />

                  <span className="truncate text-sm font-semibold text-zinc-700">
                     Hosting
                  </span>
               </div>

               {/* Center — Navigation Tabs */}
               <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                  <Link href="/hosting" className="text-zinc-500 hover:text-zinc-950 pb-1">
                     Properties
                  </Link>
                  <Link href="/hosting/reservations" className="text-zinc-900 border-b-2 border-zinc-900 pb-1">
                     Reservations
                  </Link>
               </nav>

               {/* Right filler */}
               <div className="w-[100px] md:block hidden"></div>
            </div>
         </header>

         {/* ── Page Hero ── */}
         <section className="border-b border-[#ebebeb] bg-white px-6 py-8">
            <div className="mx-auto max-w-7xl">
               <p className="text-xs font-semibold uppercase tracking-widest text-[#ff385c]">
                  Host Reservations
               </p>
               <h1 className="mt-1 text-3xl font-black tracking-tight text-[#222222]">
                  Manage Guest Reservations 🛏️
               </h1>
               <p className="mt-1 text-sm text-[#6a6a6a]">
                  Approve booking requests, review check-ins, and inspect payout histories.
               </p>
            </div>
         </section>

         {/* ── Main Content ── */}
         <main className="mx-auto max-w-7xl px-6 py-8">
            {/* Filter Tabs */}
            <div className="mb-8 flex items-center gap-1 overflow-x-auto border-b border-[#ebebeb] pb-2">
               {TABS.map((tab) => {
                  const count = tab.key === 'all'
                     ? bookings.length
                     : tab.key === 'cancelled'
                     ? bookings.filter((b) => b.status.startsWith('cancelled') || b.status === 'expired').length
                     : bookings.filter((b) => b.status === tab.key).length

                  return (
                     <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                           activeTab === tab.key
                              ? 'border-[#222] bg-[#222] text-white shadow-sm'
                              : 'border-transparent text-zinc-550 hover:bg-white hover:text-zinc-900'
                        }`}
                        id={`tab-btn-${tab.key}`}
                     >
                        {tab.label}
                        {count > 0 && (
                           <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-zinc-150 text-zinc-650'
                           }`}>
                              {count}
                           </span>
                        )}
                     </button>
                  )
               })}
            </div>

            {/* Error state */}
            {isError && (
               <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-150 bg-red-50 p-10 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="text-sm font-bold text-red-650">Failed to load reservations.</p>
                  <Button
                     onClick={() => refetch()}
                     className="rounded-xl bg-[#222] px-5 py-2 text-xs font-bold text-white hover:bg-zinc-700"
                  >
                     Try again
                  </Button>
               </div>
            )}

            {/* Empty state */}
            {!isError && filteredBookings.length === 0 && (
               <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#ebebeb] bg-white px-8 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f7f7] text-zinc-400">
                     <Inbox className="h-7 w-7" />
                  </div>
                  <div>
                     <h2 className="text-base font-black text-[#222]">No reservations found</h2>
                     <p className="mt-1 max-w-xs text-sm text-[#6a6a6a]">
                        {activeTab === 'all'
                           ? "Guests haven't booked any of your properties yet."
                           : `No reservations in the "${TABS.find((t) => t.key === activeTab)?.label}" filter.`}
                     </p>
                  </div>
               </div>
            )}

            {/* Reservations List */}
            {!isError && filteredBookings.length > 0 && (
               <div className="space-y-4">
                  {filteredBookings.map((b, index) => {
                     const isVnd = b.currency.toUpperCase() === 'VND'
                     const formattedPrice = isVnd
                        ? Number(b.totalPriceCents)
                        : Number(b.totalPriceCents) / 100

                     const fallbackImage =
                        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'
                     const thumbnail = b.property?.photoUrls?.[0] || fallbackImage

                     return (
                        <div
                           key={b.id}
                           className="flex flex-col md:flex-row overflow-hidden rounded-2xl border border-[#ebebeb] bg-white transition-all duration-200 hover:shadow-md"
                           id={`reservation-card-${b.id}`}
                        >
                           {/* Property Thumbnail */}
                           <div className="relative aspect-[4/3] w-full md:w-48 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                              <Image
                                 src={thumbnail}
                                 alt={b.property?.title || 'Listing view'}
                                 fill
                                 priority={index < 4}
                                 loading={index < 4 ? 'eager' : undefined}
                                 className="object-cover"
                                 sizes="(max-width: 768px) 100vw, 200px"
                              />
                           </div>

                           {/* Info & Details */}
                           <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                 <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                       <span
                                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${getStatusStyles(
                                             b.status
                                          )}`}
                                       >
                                          {getStatusLabel(b.status)}
                                       </span>
                                       <span className="text-[11px] font-mono font-bold text-zinc-400">
                                          REF: {b.id.split('-')[0].toUpperCase()}
                                       </span>
                                    </div>
                                    <h3 className="mt-2 text-base font-extrabold text-[#222]">
                                       {b.property?.title || 'Unknown Property'}
                                    </h3>
                                    <p className="mt-1 text-xs text-zinc-450 font-semibold">
                                       Guest ID: <span className="font-mono text-zinc-500">{b.guestId}</span>
                                    </p>
                                 </div>

                                 {/* Price Display */}
                                 <div className="text-right">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Payout</span>
                                    <span className="text-base font-black text-[#ff385c]">
                                       {formatPrice(formattedPrice, b.currency)}
                                    </span>
                                 </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">
                                 {/* Stay Details */}
                                 <div className="flex gap-5 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold">
                                       <Calendar className="h-4 w-4 text-zinc-400" />
                                       <span>
                                          {formatDate(b.checkIn)} - {formatDate(b.checkOut)} ({b.nights} night{b.nights > 1 ? 's' : ''})
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold">
                                       <Users className="h-4 w-4 text-zinc-400" />
                                       <span>{b.guestsCount} guest{b.guestsCount > 1 ? 's' : ''}</span>
                                    </div>
                                 </div>

                                 {/* Actions */}
                                 {b.status === 'pending_approval' && (
                                    <div className="flex gap-2">
                                       <Button
                                          onClick={() => handleDecline(b.id)}
                                          disabled={declineMutation.isPending || approveMutation.isPending}
                                          variant="outline"
                                          className="flex items-center gap-1.5 h-9 rounded-xl border-zinc-300 text-zinc-600 px-4 text-xs font-extrabold hover:bg-zinc-50"
                                          id={`decline-btn-${b.id}`}
                                       >
                                          <X className="h-3.5 w-3.5" />
                                          Decline
                                       </Button>
                                       <Button
                                          onClick={() => handleApprove(b.id)}
                                          disabled={declineMutation.isPending || approveMutation.isPending}
                                          className="flex items-center gap-1.5 h-9 rounded-xl bg-emerald-600 text-white px-4 text-xs font-extrabold hover:bg-emerald-700 active:bg-emerald-800"
                                          id={`approve-btn-${b.id}`}
                                       >
                                          <Check className="h-3.5 w-3.5" />
                                          Approve
                                       </Button>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}
         </main>
      </div>
   )
}
