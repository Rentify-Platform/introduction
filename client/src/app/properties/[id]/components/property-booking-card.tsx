'use client'

import { Button } from '@/components/ui/button'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal-store'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useCreateBooking } from '@/features/bookings/hooks/use-bookings-mutations'
import { useBookedDates } from '@/features/bookings/hooks/use-bookings-queries'
import { ChevronDown, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import toast from 'react-hot-toast'
import { PropertyDatePicker } from './property-date-picker'
import { PropertyGuestPicker } from './property-guest-picker'

import { formatDate } from '@/lib/format/date'
import { formatPrice } from '@/lib/format/price'
import { formatGuests } from '@/lib/format/guests'

interface PropertyBookingCardProps {
   propertyId: string
   pricePerNight: number
   cleaningFeeCents: string
   currency: string
   maxGuests: number
   averageRating: number
   totalReviews: number
}

export function PropertyBookingCard({
   propertyId,
   pricePerNight,
   cleaningFeeCents,
   currency,
   maxGuests,
   averageRating,
   totalReviews
}: PropertyBookingCardProps) {
   const [checkIn, setCheckIn] = React.useState<string | null>('2026-07-10')
   const [checkOut, setCheckOut] = React.useState<string | null>('2026-07-15')
   const [selecting, setSelecting] = React.useState<'checkIn' | 'checkOut'>('checkIn')
   const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)

   // Guest picker states
   const [adults, setAdults] = React.useState(2)
   const [childrenCount, setChildrenCount] = React.useState(0)
   const [infants, setInfants] = React.useState(0)
   const [pets, setPets] = React.useState(0)
   const [isGuestPickerOpen, setIsGuestPickerOpen] = React.useState(false)

   const { isAuthenticated } = useAuthStore()
   const { openModal } = useAuthModalStore()
   const { mutateAsync: createBooking } = useCreateBooking()
   const { data: bookedDates = [] } = useBookedDates(propertyId)
   const router = useRouter()

   const [isReserving, setIsReserving] = React.useState(false)

   // Ref to detect clicks outside popovers to close them
   const bookingCardRef = React.useRef<HTMLDivElement>(null)

   React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (bookingCardRef.current && !bookingCardRef.current.contains(event.target as Node)) {
            setIsDatePickerOpen(false)
            setIsGuestPickerOpen(false)
         }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
         document.removeEventListener('mousedown', handleClickOutside)
      }
   }, [])

   // Calculate booking pricing
   const dateIn = checkIn ? new Date(checkIn) : null
   const dateOut = checkOut ? new Date(checkOut) : null
   const nights =
      dateIn && dateOut
         ? Math.max(1, Math.ceil((dateOut.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24)))
         : 0

   const nightlyTotal = pricePerNight * nights
   const cleaningFee = Number(cleaningFeeCents) / 100
   const serviceFee = Math.round(nightlyTotal * 0.12)
   const grandTotal = nightlyTotal + cleaningFee + serviceFee

   const handleReserve = async () => {
      if (!isAuthenticated) {
         openModal('login')
         return
      }
      if (!checkIn || !checkOut) {
         setSelecting('checkIn')
         setIsDatePickerOpen(true)
         toast.error('Please select check-in and checkout dates!')
         return
      }

      try {
         setIsReserving(true)
         const booking = await createBooking({
            propertyId,
            checkIn,
            checkOut,
            guestsCount: adults + childrenCount
         })
         router.push(`/bookings/${booking.id}/checkout`)
      } catch (error: any) {
         toast.error(error.message || 'Failed to create booking')
      } finally {
         setIsReserving(false)
      }
   }

   return (
      <div
         ref={bookingCardRef}
         className="shadow-airbnb sticky top-28 space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 font-sans text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
      >
         {/* Card Header Price */}
         <div className="flex items-end justify-between">
            <div>
               <span className="text-xl font-extrabold">
                  {formatPrice(pricePerNight, currency)}
               </span>
               <span className="text-sm text-zinc-500 dark:text-zinc-400"> / night</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold">
               <Star className="h-3.5 w-3.5 fill-current text-zinc-900 dark:text-zinc-100" />
               <span>{averageRating ? averageRating.toFixed(2) : 'New'}</span>
               <span className="font-normal text-zinc-400">({totalReviews})</span>
            </div>
         </div>

         {/* Inputs Grid Box Wrapper */}
         <div className="relative space-y-2">
            <div className="overflow-hidden rounded-lg border border-zinc-300 text-left dark:border-zinc-700">
               {/* Check-in / Checkout Inputs Row */}
               <div className="grid grid-cols-2 border-b border-zinc-300 dark:border-zinc-700">
                  <div
                     onClick={() => {
                        setIsGuestPickerOpen(false)
                        setSelecting('checkIn')
                        setIsDatePickerOpen(true)
                     }}
                     className={`cursor-pointer border-r border-zinc-300 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 ${
                        selecting === 'checkIn' && isDatePickerOpen
                           ? 'bg-zinc-50 dark:bg-zinc-800'
                           : ''
                     }`}
                  >
                     <label className="block text-[8px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                        Check-in
                     </label>
                     <div className="text-zinc-850 mt-1 text-xs font-semibold dark:text-zinc-200">
                        {checkIn ? formatDate(checkIn) : 'Add date'}
                     </div>
                  </div>
                  <div
                     onClick={() => {
                        setIsGuestPickerOpen(false)
                        setSelecting('checkOut')
                        setIsDatePickerOpen(true)
                     }}
                     className={`cursor-pointer p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                        selecting === 'checkOut' && isDatePickerOpen
                           ? 'bg-zinc-50 dark:bg-zinc-800'
                           : ''
                     }`}
                  >
                     <label className="block text-[8px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                        Checkout
                     </label>
                     <div className="text-zinc-850 mt-1 text-xs font-semibold dark:text-zinc-200">
                        {checkOut ? formatDate(checkOut) : 'Add date'}
                     </div>
                  </div>
               </div>

               {/* Guests Selector Row */}
               <div
                  onClick={() => {
                     setIsDatePickerOpen(false)
                     setIsGuestPickerOpen(!isGuestPickerOpen)
                  }}
                  className={`flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                     isGuestPickerOpen ? 'bg-zinc-50 dark:bg-zinc-800' : ''
                  }`}
               >
                  <div className="w-full">
                     <label className="block text-[8px] font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                        Guests
                     </label>
                     <div className="text-zinc-850 dark:text-zinc-250 mt-1 text-xs font-semibold">
                        {formatGuests(adults, childrenCount, infants, pets)}
                     </div>
                  </div>
                  <ChevronDown
                     className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isGuestPickerOpen ? 'rotate-180' : ''}`}
                  />
               </div>
            </div>

            {/* Custom Date Picker Popover */}
            <PropertyDatePicker
               checkIn={checkIn}
               checkOut={checkOut}
               onDatesChange={(inDate, outDate) => {
                  setCheckIn(inDate)
                  setCheckOut(outDate)
               }}
               isOpen={isDatePickerOpen}
               onClose={() => setIsDatePickerOpen(false)}
               selecting={selecting}
               onSelectingChange={setSelecting}
               bookedDates={bookedDates}
            />

            {/* Custom Guest Picker Popover */}
            <PropertyGuestPicker
               maxGuests={maxGuests}
               adults={adults}
               childrenCount={childrenCount}
               infants={infants}
               pets={pets}
               onChange={(newAdults, newChildren, newInfants, newPets) => {
                  setAdults(newAdults)
                  setChildrenCount(newChildren)
                  setInfants(newInfants)
                  setPets(newPets)
               }}
               isOpen={isGuestPickerOpen}
               onClose={() => setIsGuestPickerOpen(false)}
            />
         </div>

         {/* Reserve Action Button */}
         <Button
            onClick={handleReserve}
            disabled={isReserving}
            className="h-12 w-full rounded-lg bg-[#ff385c] font-bold text-white shadow-md transition-all hover:bg-[#e00b41] active:scale-[0.98]"
         >
            {isReserving ? 'Reserving...' : 'Reserve'}
         </Button>
         <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {"You won't be charged yet"}
         </p>

         {/* Price Breakdown or Selection Prompt */}
         {checkIn && checkOut ? (
            <div className="space-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
               <div className="flex justify-between">
                  <span className="text-zinc-500 underline dark:text-zinc-400">
                     {formatPrice(pricePerNight, currency)} × {nights} night{nights > 1 ? 's' : ''}
                  </span>
                  <span>{formatPrice(nightlyTotal, currency)}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-zinc-500 underline dark:text-zinc-400">Cleaning fee</span>
                  <span>{formatPrice(cleaningFee, currency)}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-zinc-500 underline dark:text-zinc-400">
                     Belong service fee
                  </span>
                  <span>{formatPrice(serviceFee, currency)}</span>
               </div>
               <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-extrabold dark:border-zinc-800">
                  <span>Total before taxes</span>
                  <span>{formatPrice(grandTotal, currency)}</span>
               </div>
            </div>
         ) : (
            <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
               Add check-in and checkout dates to see pricing breakdown.
            </div>
         )}
      </div>
   )
}
