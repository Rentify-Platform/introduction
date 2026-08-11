'use client'

import * as React from 'react'
import { Check, Mail, Phone, ShieldCheck, AlertCircle } from 'lucide-react'
import { User } from '@/features/auth/types'

interface ProfileVerificationsProps {
   user: User
   onEditClick: () => void
}

export function ProfileVerifications({ user, onEditClick }: ProfileVerificationsProps) {
   const isIdentityVerified = user.guestKycStatus === 'verified'
   const isIdentityPending = user.guestKycStatus === 'pending'
   const isIdentityRejected = user.guestKycStatus === 'rejected'

   return (
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
         <h3 className="mb-4 text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {user.firstName}&apos;s Confirmed Information
         </h3>

         <div className="space-y-4">
            {/* Identity Verification */}
            <div className="flex items-start gap-3">
               <div className="text-zinc-550 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
               </div>
               <div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-zinc-850 text-xs font-bold dark:text-zinc-200">
                        Identity Verification
                     </span>
                     {isIdentityVerified ? (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                           <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                     ) : isIdentityPending ? (
                        <span className="rounded border border-amber-200/50 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                           Pending
                        </span>
                     ) : (
                        <span className="dark:bg-zinc-850 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:text-zinc-400">
                           <AlertCircle className="h-3 w-3" />
                        </span>
                     )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                     {isIdentityVerified
                        ? 'Your identity has been verified through government check.'
                        : isIdentityPending
                          ? 'Government verification is in progress.'
                          : isIdentityRejected
                            ? 'Verification rejected. Please re-submit.'
                            : 'Verify identity to build trust and unlock bookings.'}
                  </p>
               </div>
            </div>

            {/* Email Verification */}
            <div className="flex items-start gap-3">
               <div className="text-zinc-550 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
               </div>
               <div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-zinc-850 text-xs font-bold dark:text-zinc-200">
                        Email Address
                     </span>
                     <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                     </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                     {user.email} (Verified)
                  </p>
               </div>
            </div>

            {/* Phone Verification */}
            <div className="flex items-start gap-3">
               <div className="text-zinc-550 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  <Phone className="h-3.5 w-3.5" />
               </div>
               <div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-zinc-850 text-xs font-bold dark:text-zinc-200">
                        Phone Number
                     </span>
                     {user.phone ? (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                           <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                     ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                     {user.phone ? `${user.phone} (Verified)` : 'No phone number linked.'}
                  </p>
                  {!user.phone && (
                     <button
                        type="button"
                        onClick={onEditClick}
                        className="mt-1 cursor-pointer border-none bg-transparent p-0 text-[11px] font-extrabold text-[#ff385c] hover:underline"
                     >
                        Add Phone Number
                     </button>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}
