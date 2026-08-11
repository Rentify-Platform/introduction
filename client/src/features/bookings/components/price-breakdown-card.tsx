'use client'

import { ListingDetail } from '@/features/listings/types'
import { formatPrice } from '@/lib/format/price'
import { ShieldCheck, Star } from 'lucide-react'
import { Booking } from '../types'

interface PriceBreakdownCardProps {
   booking: Booking
   listingDetail: ListingDetail | undefined
}

export function PriceBreakdownCard({ booking, listingDetail }: PriceBreakdownCardProps) {
   const property = listingDetail?.property
   const payment = booking.payment
   const isVnd = booking.currency.toUpperCase() === 'VND'
   const amount = payment
      ? isVnd
         ? Number(payment.amountCents)
         : Number(payment.amountCents) / 100
      : 0

   const cleaningFee = isVnd
      ? Number(booking.cleaningFeeCents)
      : Number(booking.cleaningFeeCents) / 100

   const serviceFee = isVnd
      ? Number(booking.serviceFeeCents)
      : Number(booking.serviceFeeCents) / 100

   if (!property) return null

   return (
      <div className="sticky top-28 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900/25">
         {/* Listing Card Info */}
         <div className="border-zinc-150 flex gap-4 border-b pb-5 dark:border-zinc-800">
            <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img
                  src={property.thumbnailUrl || '/placeholder.png'}
                  alt={property.title}
                  className="h-full w-full object-cover"
               />
            </div>
            <div className="flex flex-col justify-between py-0.5">
               <div>
                  <span className="text-zinc-450 text-[10px] dark:text-zinc-500">
                     {property.roomType}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                     {property.title}
                  </h3>
               </div>
               <div className="flex items-center gap-1 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-current text-zinc-900 dark:text-zinc-100" />
                  <span>
                     {listingDetail?.averageRating ? listingDetail.averageRating.toFixed(2) : 'New'}
                  </span>
                  <span className="font-normal text-zinc-400">
                     ({listingDetail?.totalReviews || 0})
                  </span>
               </div>
            </div>
         </div>

         {/* Price Details Breakdown */}
         <div className="mt-5 space-y-4">
            <h3 className="text-base font-bold">Price details</h3>

            <div className="space-y-3 text-sm">
               <div className="flex justify-between">
                  <span className="text-zinc-555 dark:text-zinc-400">
                     {formatPrice(property.price, booking.currency)} × {booking.nights} night
                     {booking.nights > 1 ? 's' : ''}
                  </span>
                  <span>{formatPrice(property.price * booking.nights, booking.currency)}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-zinc-555 underline dark:text-zinc-400">Cleaning fee</span>
                  <span>{formatPrice(cleaningFee, booking.currency)}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-zinc-555 underline dark:text-zinc-400">Service fee</span>
                  <span>{formatPrice(serviceFee, booking.currency)}</span>
               </div>

               <div className="border-zinc-150 flex justify-between border-t pt-4 text-base font-extrabold dark:border-zinc-800">
                  <span>Total ({booking.currency})</span>
                  <span>{formatPrice(amount, booking.currency)}</span>
               </div>
            </div>
         </div>

         {/* Security badge */}
         <div className="border-zinc-150 mt-6 flex items-start gap-2.5 border-t pt-5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
            <span className="leading-normal">
               <strong className="text-zinc-800 dark:text-zinc-200">Belong Protection:</strong> Your
               transfer is protected. Funds are held securely until check-in.
            </span>
         </div>
      </div>
   )
}
