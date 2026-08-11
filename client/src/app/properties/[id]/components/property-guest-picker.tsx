'use client'

import * as React from 'react'
import { Plus, Minus } from 'lucide-react'

interface PropertyGuestPickerProps {
   maxGuests: number
   adults: number
   childrenCount: number
   infants: number
   pets: number
   onChange: (adults: number, children: number, infants: number, pets: number) => void
   isOpen: boolean
   onClose: () => void
}

export function PropertyGuestPicker({
   maxGuests,
   adults,
   childrenCount,
   infants,
   pets,
   onChange,
   isOpen,
   onClose
}: PropertyGuestPickerProps) {
   if (!isOpen) return null

   const totalGuests = adults + childrenCount
   const isPlusGuestsDisabled = totalGuests >= maxGuests

   const handleIncrementAdults = () => {
      if (!isPlusGuestsDisabled) {
         onChange(adults + 1, childrenCount, infants, pets)
      }
   }

   const handleDecrementAdults = () => {
      if (adults > 1) {
         onChange(adults - 1, childrenCount, infants, pets)
      }
   }

   const handleIncrementChildren = () => {
      if (!isPlusGuestsDisabled) {
         onChange(adults, childrenCount + 1, infants, pets)
      }
   }

   const handleDecrementChildren = () => {
      if (childrenCount > 0) {
         onChange(adults, childrenCount - 1, infants, pets)
      }
   }

   const handleIncrementInfants = () => {
      if (infants < 5) {
         onChange(adults, childrenCount, infants + 1, pets)
      }
   }

   const handleDecrementInfants = () => {
      if (infants > 0) {
         onChange(adults, childrenCount, infants - 1, pets)
      }
   }

   const handleIncrementPets = () => {
      // Assuming pets is allowed up to 2 for service animals or mock
      if (pets < 2) {
         onChange(adults, childrenCount, infants, pets + 1)
      }
   }

   const handleDecrementPets = () => {
      if (pets > 0) {
         onChange(adults, childrenCount, infants, pets - 1)
      }
   }

   return (
      <div className="absolute top-[105%] right-0 z-50 w-full space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 font-sans text-zinc-900 shadow-2xl sm:w-[360px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
         {/* Adults Row */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-sm font-bold">Adults</h4>
               <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Age 13 or above</p>
            </div>
            <div className="flex items-center gap-4">
               <button
                  type="button"
                  onClick={handleDecrementAdults}
                  disabled={adults <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Minus className="h-4 w-4" />
               </button>
               <span className="w-4 text-center text-sm font-semibold">{adults}</span>
               <button
                  type="button"
                  onClick={handleIncrementAdults}
                  disabled={isPlusGuestsDisabled}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Plus className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Children Row */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-sm font-bold">Children</h4>
               <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Ages 2 – 12</p>
            </div>
            <div className="flex items-center gap-4">
               <button
                  type="button"
                  onClick={handleDecrementChildren}
                  disabled={childrenCount <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Minus className="h-4 w-4" />
               </button>
               <span className="w-4 text-center text-sm font-semibold">{childrenCount}</span>
               <button
                  type="button"
                  onClick={handleIncrementChildren}
                  disabled={isPlusGuestsDisabled}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Plus className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Infants Row */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-sm font-bold">Infants</h4>
               <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Under 2</p>
            </div>
            <div className="flex items-center gap-4">
               <button
                  type="button"
                  onClick={handleDecrementInfants}
                  disabled={infants <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Minus className="h-4 w-4" />
               </button>
               <span className="w-4 text-center text-sm font-semibold">{infants}</span>
               <button
                  type="button"
                  onClick={handleIncrementInfants}
                  disabled={infants >= 5}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Plus className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Pets Row */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-sm font-bold">Pets</h4>
               <button
                  type="button"
                  className="mt-0.5 block text-left text-xs font-bold text-zinc-800 underline hover:text-zinc-500 dark:text-zinc-200"
               >
                  Bringing a service animal?
               </button>
            </div>
            <div className="flex items-center gap-4">
               <button
                  type="button"
                  onClick={handleDecrementPets}
                  disabled={pets <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Minus className="h-4 w-4" />
               </button>
               <span className="w-4 text-center text-sm font-semibold">{pets}</span>
               <button
                  type="button"
                  onClick={handleIncrementPets}
                  disabled={pets >= 2}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:border-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-200"
               >
                  <Plus className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Rules Notice */}
         <p className="border-t border-zinc-100 pt-4 text-xs leading-normal text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            This place has a maximum of {maxGuests} guests, not including infants. Pets are not
            allowed.
         </p>

         {/* Close Button */}
         <div className="flex justify-end">
            <button
               type="button"
               onClick={onClose}
               className="p-2 text-sm font-bold text-zinc-900 hover:underline dark:text-white"
            >
               Close
            </button>
         </div>
      </div>
   )
}
