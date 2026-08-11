'use client'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format/price'
import { AlertCircle, Check, Copy, Loader2 } from 'lucide-react'
import * as React from 'react'
import toast from 'react-hot-toast'
import { Booking } from '../types'

interface BankTransferPaymentProps {
   booking: Booking
}

export function BankTransferPayment({ booking }: BankTransferPaymentProps) {
   const [copiedField, setCopiedField] = React.useState<string | null>(null)

   const payment = booking.payment
   const isVnd = booking.currency.toUpperCase() === 'VND'
   const amount = payment
      ? isVnd
         ? Number(payment.amountCents)
         : Number(payment.amountCents) / 100
      : 0
   const description = payment?.providerIntentId || ''

   // 1.   Check if the payment was generated with a dynamic Virtual Account
   const isDynamicVa = !!(payment?.vaNumber && payment?.qrCodeUrl)

   const baseBankName = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || ''
   const bankAccount = isDynamicVa
      ? payment.vaNumber!
      : process.env.NEXT_PUBLIC_SEPAY_BANK_ACCOUNT || ''
   const bankName = baseBankName
   const accountHolder = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_HOLDER || ''

   const qrCodeUrl = isDynamicVa
      ? payment.qrCodeUrl!
      : payment
        ? `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${description}`
        : ''

   // 2.   Implement dynamic countdown timer based on backend's expiredAt timestamp
   const [timeLeft, setTimeLeft] = React.useState<number>(0)

   React.useEffect(() => {
      if (!payment?.expiredAt) return

      const calculateTimeLeft = () => {
         const expiry = new Date(payment.expiredAt!).getTime()
         const now = Date.now()
         const diff = Math.max(0, Math.floor((expiry - now) / 1000))
         setTimeLeft(diff)
      }

      calculateTimeLeft()
      const timer = setInterval(calculateTimeLeft, 1000)

      return () => clearInterval(timer)
   }, [payment?.expiredAt])

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
   }

   const handleCopy = (text: string, field: string) => {
      navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard!`)
      setTimeout(() => setCopiedField(null), 2000)
   }

   return (
      <section className="space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Complete Bank Transfer</h2>
            {payment?.expiredAt ? (
               <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                     timeLeft > 0
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}
               >
                  {timeLeft > 0 && <Loader2 className="h-3 w-3 animate-spin" />}
                  {timeLeft > 0 ? `Timeout: ${formatTime(timeLeft)}` : 'Expired'}
               </span>
            ) : (
               <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Pending Payment
               </span>
            )}
         </div>

         <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Open your mobile banking application and scan the VietQR code, or copy the transfer
            details below to complete the booking.
         </p>

         <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* VietQR Display */}
            <div className="border-zinc-150 flex flex-col items-center justify-center rounded-2xl border bg-zinc-50/50 p-6 md:col-span-5 dark:border-zinc-800 dark:bg-zinc-900/10">
               <div className="dark:bg-zinc-955 relative flex aspect-square w-full max-w-[200px] items-center justify-center rounded-xl bg-white p-3.5 shadow-md">
                  {qrCodeUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img
                        src={qrCodeUrl}
                        alt="VietQR bank transfer code"
                        className="h-full w-full object-contain"
                     />
                  ) : (
                     <Loader2 className="h-8 w-8 animate-spin text-[#ff385c]" />
                  )}
               </div>
               <span className="mt-3 text-center text-[10px] font-bold text-zinc-400 uppercase">
                  Scan with any banking app
               </span>
            </div>

            {/* Copyable Fields */}
            <div className="space-y-3 md:col-span-7">
               <div className="grid grid-cols-2 gap-3">
                  <div className="border-zinc-150 rounded-xl border p-3 dark:border-zinc-800">
                     <span className="block text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                        Bank Name
                     </span>
                     <span className="mt-0.5 block text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {bankName}
                     </span>
                  </div>
                  <div className="border-zinc-150 rounded-xl border p-3 dark:border-zinc-800">
                     <span className="block text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                        Account Owner
                     </span>
                     <span className="mt-0.5 block truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {accountHolder}
                     </span>
                  </div>
               </div>

               {/* Account Number */}
               <div className="border-zinc-150 flex items-center justify-between rounded-xl border p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800">
                  <div>
                     <span className="block text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                        Account Number
                     </span>
                     <span className="mt-0.5 block font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {bankAccount}
                     </span>
                  </div>
                  <Button
                     type="button"
                     variant="ghost"
                     size="icon-sm"
                     onClick={() => handleCopy(bankAccount, 'Account number')}
                  >
                     {copiedField === 'Account number' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                     ) : (
                        <Copy className="h-4 w-4 text-zinc-400" />
                     )}
                  </Button>
               </div>

               {/* Amount */}
               <div className="border-zinc-150 flex items-center justify-between rounded-xl border p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800">
                  <div>
                     <span className="block text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                        Amount
                     </span>
                     <span className="mt-0.5 block text-base font-extrabold text-[#ff385c]">
                        {formatPrice(amount, booking.currency)}
                     </span>
                  </div>
                  <Button
                     type="button"
                     variant="ghost"
                     size="icon-sm"
                     onClick={() => handleCopy(amount.toString(), 'Amount')}
                  >
                     {copiedField === 'Amount' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                     ) : (
                        <Copy className="h-4 w-4 text-zinc-400" />
                     )}
                  </Button>
               </div>

               {/* Content */}
               <div
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                     isDynamicVa
                        ? 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30'
                        : 'border-[#ff385c]/25 bg-[#ff385c]/5 hover:bg-[#ff385c]/10'
                  }`}
               >
                  <div>
                     <span
                        className={`block text-[9px] font-bold tracking-wider uppercase ${isDynamicVa ? 'text-zinc-400' : 'text-[#ff385c]'}`}
                     >
                        {isDynamicVa
                           ? 'Transfer Content (Optional)'
                           : 'Transfer Content (Required)'}
                     </span>
                     <span className="mt-0.5 block font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {isDynamicVa ? 'Optional (Any content is fine)' : description}
                     </span>
                  </div>
                  {!isDynamicVa && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy(description, 'Transfer content')}
                        className="text-[#ff385c] hover:bg-[#ff385c]/10"
                     >
                        {copiedField === 'Transfer content' ? (
                           <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                           <Copy className="h-4 w-4" />
                        )}
                     </Button>
                  )}
               </div>
            </div>
         </div>

         {/* Critical warning */}
         <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 dark:border-amber-900/35 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
               <span className="font-bold">Required Details:</span> You must transfer the exact
               amount and input the transfer content string exactly as shown. SePay will reconcile
               the transaction and approve the reservation automatically.
            </div>
         </div>
      </section>
   )
}
