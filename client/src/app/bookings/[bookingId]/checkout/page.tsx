'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBookingDetail } from '@/features/bookings/hooks/use-bookings-queries'
import { useListingDetail } from '@/features/listings/hooks/use-listings-queries'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { CheckoutHeader } from '@/features/bookings/components/checkout-header'
import { CheckoutSuccessView } from '@/features/bookings/components/checkout-success-view'
import { TripDetailsSection } from '@/features/bookings/components/trip-details-section'
import { BankTransferPayment } from '@/features/bookings/components/bank-transfer-payment'
import { PriceBreakdownCard } from '@/features/bookings/components/price-breakdown-card'
import { CancellationPolicySection } from '@/features/bookings/components/cancellation-policy-section'
import { GroundRulesSection } from '@/features/bookings/components/ground-rules-section'

export default function CheckoutPage() {
   const params = useParams()
   const router = useRouter()
   const bookingId = params.bookingId as string
   const [isPollingActive, setIsPollingActive] = React.useState(true)

   // 1. Fetch booking details and poll every 3 seconds for payment status
   const {
      data: booking,
      isLoading: isBookingLoading,
      error: bookingError
   } = useBookingDetail(bookingId, {
      enabled: !!bookingId && isPollingActive,
      refetchInterval: isPollingActive ? 3000 : false
   })

   const propertyId = booking?.propertyId || ''

   // 2. Fetch property listing details
   const { data: listingDetail, isLoading: isListingLoading } = useListingDetail(propertyId)

   const isConfirmed = booking?.status === 'confirmed'

   React.useEffect(() => {
      if (isConfirmed) {
         setIsPollingActive(false)
      }
   }, [isConfirmed])

   if (isBookingLoading || (!!propertyId && isListingLoading)) {
      return (
         <div className="dark:bg-zinc-955 flex min-h-screen flex-col items-center justify-center bg-zinc-50">
            <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
            <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
               Loading checkout details...
            </p>
         </div>
      )
   }

   if (bookingError || !booking) {
      return (
         <div className="dark:bg-zinc-955 flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-400" />
            <h2 className="mt-4 text-xl font-bold">Booking Not Found</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
               We could not find the booking details. It might have expired or been cancelled.
            </p>
            <Button onClick={() => router.push('/')} className="mt-6 bg-[#ff385c] text-white">
               Go Back Home
            </Button>
         </div>
      )
   }

   const property = listingDetail?.property

   return (
      <div className="dark:bg-zinc-955 min-h-screen bg-white pb-20 font-sans text-zinc-900 dark:text-zinc-100">
         <CheckoutHeader isConfirmed={isConfirmed} />

         <main className="mx-auto max-w-6xl px-6 pt-10">
            {isConfirmed ? (
               <CheckoutSuccessView booking={booking} property={property} />
            ) : (
               <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
                  {/* Left Column - Booking info & Payment Details */}
                  <div className="space-y-10 lg:col-span-3">
                     <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                        Confirm and pay
                     </h1>
                     <TripDetailsSection booking={booking} />
                     <BankTransferPayment booking={booking} />
                     <CancellationPolicySection booking={booking} />
                     <GroundRulesSection />
                  </div>

                  {/* Right Column - Listing Summary & Price Breakdown */}
                  <div className="lg:col-span-2">
                     <PriceBreakdownCard booking={booking} listingDetail={listingDetail} />
                  </div>
               </div>
            )}
         </main>
      </div>
   )
}
