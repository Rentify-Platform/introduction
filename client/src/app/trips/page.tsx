'use client'

import { Navbar } from '@/components/shared/navbar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useGuestBookings } from '@/features/bookings/hooks/use-bookings-queries'
import { useCancelBooking } from '@/features/bookings/hooks/use-bookings-mutations'
import { formatDate } from '@/lib/format/date'
import { formatPrice } from '@/lib/format/price'
import { Calendar, Compass, CreditCard, Loader2, MapPin, XCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import toast from 'react-hot-toast'

type TabType = 'all' | 'upcoming' | 'past' | 'cancelled'

export default function MyTripsPage() {
   const router = useRouter()
   const { isAuthenticated, isInitialized } = useAuthStore()
   const { data: bookings = [], isLoading, isError, refetch } = useGuestBookings()
   const [activeTab, setActiveTab] = React.useState<TabType>('all')
   const cancelMutation = useCancelBooking()

   const handleCancel = async (id: string) => {
      const reason = window.prompt('Enter cancellation reason (optional):')
      if (reason === null) return // Guest clicked Cancel on prompt

      try {
         await cancelMutation.mutateAsync({ id, reason: reason || undefined })
         toast.success('Booking cancelled successfully!')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to cancel booking')
      }
   }

   // Protect page routing
   React.useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         router.push('/login?redirect=/trips')
      }
   }, [isInitialized, isAuthenticated, router])

   if (isLoading || !isInitialized) {
      return (
         <div className="min-h-screen bg-white dark:bg-zinc-950">
            <Navbar />
            <div className="flex min-h-[70vh] flex-col items-center justify-center font-sans">
               <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
               <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading your trips...
               </p>
            </div>
         </div>
      )
   }

   if (isError) {
      return (
         <div className="min-h-screen bg-white dark:bg-zinc-950">
            <Navbar />
            <div className="flex min-h-[70vh] flex-col items-center justify-center font-sans">
               <p className="text-sm font-semibold text-red-500">Failed to load your trips.</p>
               <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-[#ff385c] text-white"
               >
                  Retry
               </Button>
            </div>
         </div>
      )
   }

   // Filter logic
   const now = new Date()
   const filteredBookings = bookings.filter((b) => {
      const checkInDate = new Date(b.checkIn)
      const isCancelled = b.status.startsWith('cancelled')

      if (activeTab === 'cancelled') {
         return isCancelled
      }
      if (activeTab === 'upcoming') {
         return !isCancelled && checkInDate >= now
      }
      if (activeTab === 'past') {
         return !isCancelled && checkInDate < now
      }
      return true
   })

   const getStatusLabel = (status: string) => {
      switch (status) {
         case 'pending':
            return 'Pending Payment'
         case 'pending_approval':
            return 'Awaiting Host Approval'
         case 'confirmed':
            return 'Confirmed'
         case 'completed':
            return 'Completed'
         case 'cancelled_by_guest':
         case 'cancelled_by_host':
            return 'Cancelled'
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
         case 'pending':
            return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
         case 'pending_approval':
            return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50'
         case 'completed':
            return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
         default:
            return 'bg-zinc-50 text-zinc-500 border-zinc-150 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800'
      }
   }

   return (
      <div className="min-h-screen bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
         <Navbar />

         <div className="mx-auto max-w-[1080px] px-6 py-10">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
               Trips
            </h1>

            {/* Shopee / Airbnb styled Sub-navigation Tabs */}
            <div className="mt-6 flex border-b border-zinc-200 dark:border-zinc-800">
               {(['all', 'upcoming', 'past', 'cancelled'] as TabType[]).map((tab) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`border-b-2 px-4 pb-4 text-sm font-semibold capitalize transition-all duration-200 ${
                        activeTab === tab
                           ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                           : 'hover:text-zinc-650 border-transparent text-zinc-400 dark:hover:text-zinc-300'
                     }`}
                  >
                     {tab} trips
                  </button>
               ))}
            </div>

            {/* Content list */}
            {filteredBookings.length === 0 ? (
               <div className="flex min-h-[45vh] flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-zinc-50 p-6 dark:bg-zinc-900">
                     <Compass className="h-12 w-12 text-[#ff385c]" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-zinc-900 dark:text-white">
                     No trips {activeTab !== 'all' ? `in "${activeTab}"` : ''} yet
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                     Time to dust off your bags and start planning your next adventure.
                  </p>
                  <Link href="/" className="mt-6">
                     <Button className="rounded-xl bg-[#ff385c] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e00b41]">
                        Start searching
                     </Button>
                  </Link>
               </div>
            ) : (
               <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {filteredBookings.map((b) => {
                     const isVnd = b.currency.toUpperCase() === 'VND'
                     const formattedPriceVal = isVnd
                        ? Number(b.totalPriceCents)
                        : Number(b.totalPriceCents) / 100

                     const fallbackImage =
                        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'
                     const thumbnail = b.property?.photoUrls?.[0] || fallbackImage

                     return (
                        <div
                           key={b.id}
                           className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40"
                        >
                           {/* Flex body containing image and text info */}
                           <div className="flex flex-1 flex-col gap-5 p-5 sm:flex-row">
                              {/* Left Thumbnail photo collage style */}
                              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:w-36 dark:bg-zinc-800">
                                 <Image
                                    src={thumbnail}
                                    alt={b.property?.title || 'Property view'}
                                    fill
                                    className="object-cover"
                                    sizes="(max-w-768px) 100vw, 150px"
                                 />
                              </div>

                              {/* Right Content info */}
                              <div className="flex flex-1 flex-col justify-between">
                                 <div>
                                    <div className="flex items-center justify-between">
                                       <span
                                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${getStatusStyles(
                                             b.status
                                          )}`}
                                       >
                                          {getStatusLabel(b.status)}
                                       </span>
                                    </div>
                                    <h3 className="mt-2 line-clamp-1 text-sm font-extrabold text-zinc-900 dark:text-white">
                                       {b.property?.title || 'Unknown Property'}
                                    </h3>
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                       <MapPin className="h-3.5 w-3.5" />
                                       <span>
                                          {b.property?.city || 'Worldwide'},{' '}
                                          {b.property?.countryCode || ''}
                                       </span>
                                    </div>
                                 </div>

                                 {/* Dates & price row */}
                                 <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                                    <div className="text-zinc-650 flex items-center gap-2 text-xs dark:text-zinc-400">
                                       <Calendar className="h-3.5 w-3.5" />
                                       <span>
                                          {formatDate(b.checkIn)} - {formatDate(b.checkOut)} (
                                          {b.nights} night{b.nights > 1 ? 's' : ''})
                                       </span>
                                    </div>
                                    <div className="mt-1.5 text-xs">
                                       Total:{' '}
                                       <span className="font-extrabold text-zinc-900 dark:text-white">
                                          {formatPrice(formattedPriceVal, b.currency)}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Footer card action buttons */}
                           <div className="border-zinc-150 dark:border-zinc-850 flex justify-end gap-3 border-t bg-zinc-50/50 p-4 px-5 dark:bg-zinc-900/20">
                              <Link href={`/bookings/${b.id}/checkout`}>
                                 <Button
                                    variant="outline"
                                    className="h-9 rounded-xl border-zinc-300 px-4 text-xs font-extrabold transition-all dark:border-zinc-700"
                                 >
                                    View Receipt
                                 </Button>
                              </Link>
                              {b.status === 'pending' && (
                                 <Link href={`/bookings/${b.id}/checkout`}>
                                    <Button className="h-9 rounded-xl bg-[#ff385c] px-4 text-xs font-extrabold text-white hover:bg-[#e00b41]">
                                       <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                       Pay Now
                                    </Button>
                                 </Link>
                              )}
                              {(b.status === 'pending' || b.status === 'pending_approval' || b.status === 'confirmed') && (
                                 <Button
                                    onClick={() => handleCancel(b.id)}
                                    disabled={cancelMutation.isPending}
                                    variant="outline"
                                    className="h-9 rounded-xl border-red-200 text-red-600 px-4 text-xs font-extrabold hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20"
                                 >
                                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Cancel Booking
                                 </Button>
                              )}
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}
         </div>
      </div>
   )
}
