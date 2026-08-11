'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useCurrentUser } from '@/features/auth/hooks/use-auth-queries'
import { hostService } from '@/features/hosting/services/host-service'
import { useHostMutations } from '@/features/hosting/hooks/use-host-mutations'
import { useUpload } from '@/hooks/use-upload'
import { Navbar } from '@/components/shared/navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, Check, ShieldCheck, DollarSign, Percent, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ApiResponse } from '@/features/auth/types'

interface HostProfileInfo {
   accountId: string
   about: string | null
   isSuperhost: boolean
   responseRatePct: number
   avgResponseMinutes: number
   kycStatus: string
   taxCountry: string | null
   taxFormType: string | null
   taxVerified: boolean
   payoutProvider: string | null
   payoutAccountId: string | null
   payoutAccountVerified: boolean
   becameHostAt: string | null
}

export default function HostOnboardingPage() {
   const router = useRouter()
   const { isAuthenticated, isInitialized } = useAuthStore()
   const { data: user } = useCurrentUser()
   const { uploadFile } = useUpload()
   const { registerHost, isRegistering } = useHostMutations()

   const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)
   const [uploadingSide, setUploadingSide] = React.useState<'front' | 'back' | null>(null)

   // Form states - Identity
   const [docType, setDocType] = React.useState('passport')
   const [countryCode, setCountryCode] = React.useState('US')
   const [documentNumber, setDocumentNumber] = React.useState('')
   const [frontPhotoUrl, setFrontPhotoUrl] = React.useState('')
   const [backPhotoUrl, setBackPhotoUrl] = React.useState('')

   // Form states - Tax
   const [taxCountry, setTaxCountry] = React.useState('US')
   const [taxId, setTaxId] = React.useState('')
   const [taxFormType, setTaxFormType] = React.useState('W-9')

   // Form states - Payout
   const [payoutProvider, setPayoutProvider] = React.useState('stripe')
   const [payoutAccountId, setPayoutAccountId] = React.useState('')

   // Route protection & Host redirect
   React.useEffect(() => {
      if (isInitialized) {
         if (!isAuthenticated) {
            toast.error('Please log in first.')
            router.push('/login')
            return
         }

         hostService
            .getProfile()
            .then((res: ApiResponse<unknown>) => {
               const profile = res.data as HostProfileInfo
               if (profile && profile.kycStatus === 'verified') {
                  router.push('/hosting')
               }
            })
            .catch(() => {
               // Profile not found - guest can proceed to complete KYC
            })
            .finally(() => {
               setIsLoadingProfile(false)
            })
      }
   }, [isInitialized, isAuthenticated, router])

   const handlePhotoUpload = async (
      e: React.ChangeEvent<HTMLInputElement>,
      type: 'front' | 'back'
   ) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploadingSide(type)
      try {
         const url = await uploadFile(files[0])
         if (type === 'front') {
            setFrontPhotoUrl(url)
         } else {
            setBackPhotoUrl(url)
         }
         toast.success('Document uploaded successfully!')
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Upload failed'
         toast.error(msg)
      } finally {
         setUploadingSide(null)
      }
   }

   const handleSubmitAll = async (e: React.FormEvent) => {
      e.preventDefault()

      const needsIdentity = user?.guestKycStatus !== 'verified'
      if (needsIdentity) {
         if (!documentNumber.trim()) {
            return toast.error('Please enter your Identity document number.')
         }
         if (!frontPhotoUrl) {
            return toast.error('Please upload the front photo of your identity document.')
         }
      }
      if (!taxId.trim()) {
         return toast.error('Please enter your Tax ID.')
      }
      if (!payoutAccountId.trim()) {
         return toast.error('Please enter your payout account details.')
      }

      try {
         await registerHost({
            identity: needsIdentity
               ? {
                    docType,
                    countryCode,
                    documentNumber: documentNumber.trim(),
                    fileUrlFront: frontPhotoUrl,
                    ...(backPhotoUrl.trim() ? { fileUrlBack: backPhotoUrl.trim() } : {})
                 }
               : null,
            taxCountry,
            taxId: taxId.trim(),
            taxFormType,
            payoutProvider,
            payoutAccountId: payoutAccountId.trim()
         })

         toast.success('Host registration & KYC completed successfully!')
         router.push('/hosting')
      } catch (err: unknown) {
         const errorObj = err as {
            response?: { data?: { message?: string | string[] } }
            message?: string
         }
         const backendMsg = errorObj?.response?.data?.message
         const msg =
            (Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg) ||
            errorObj.message ||
            'Onboarding failed.'
         toast.error(msg)
      }
   }

   if (!isInitialized || !isAuthenticated || isLoadingProfile) {
      return (
         <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
            <Navbar />
            <div className="flex flex-1 flex-col items-center justify-center font-sans">
               <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
               <p className="mt-4 text-sm text-zinc-500">Loading onboarding details...</p>
            </div>
         </div>
      )
   }

   const needsIdentity = user?.guestKycStatus !== 'verified'

   return (
      <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
         <Navbar />

         <main className="flex-1 py-12">
            <div className="mx-auto max-w-2xl px-6">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                     Become a Host
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                     Complete host verification and details to start listing your properties.
                  </p>
               </div>

               <form onSubmit={handleSubmitAll} className="space-y-10">
                  {/* Identity Section */}
                  <div className="space-y-6 rounded-3xl border border-zinc-200 bg-zinc-50/20 p-6 dark:border-zinc-800 dark:bg-zinc-900/10">
                     <div className="dark:border-zinc-850 flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c] dark:bg-rose-950/20">
                           <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                           <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              1. Personal Identity Verification
                           </h2>
                           <p className="text-zinc-550 dark:text-zinc-450 mt-0.5 text-xs">
                              Required for security checking.
                           </p>
                        </div>
                     </div>

                     {needsIdentity ? (
                        <div className="space-y-4">
                           <div>
                              <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                 Document Type
                              </label>
                              <select
                                 value={docType}
                                 onChange={(e) => setDocType(e.target.value)}
                                 className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                              >
                                 <option value="passport">Passport</option>
                                 <option value="national_id">National ID Card</option>
                                 <option value="drivers_license">Driver&apos;s License</option>
                              </select>
                           </div>

                           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <Input
                                 label="Issuing Country Code"
                                 value={countryCode}
                                 onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                                 maxLength={3}
                                 placeholder="e.g. US, VN, CA"
                                 required
                              />

                              <Input
                                 label="Document Number"
                                 value={documentNumber}
                                 onChange={(e) => setDocumentNumber(e.target.value)}
                                 placeholder="e.g. N12345678"
                                 required
                              />
                           </div>

                           <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                              {/* File upload front */}
                              <div>
                                 <label className="mb-2 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                    Front of Document
                                 </label>
                                 <div className="group border-zinc-250 relative h-28 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-white hover:border-[#ff385c]/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900">
                                    <input
                                       type="file"
                                       accept="image/*"
                                       onChange={(e) => handlePhotoUpload(e, 'front')}
                                       className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                       disabled={uploadingSide !== null}
                                    />
                                    {frontPhotoUrl ? (
                                       <>
                                          <img
                                             src={frontPhotoUrl}
                                             alt="Front of document"
                                             className="absolute inset-0 h-full w-full object-cover"
                                          />
                                          <span className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow">
                                             <Check className="h-3 w-3 text-white" />
                                          </span>
                                       </>
                                    ) : uploadingSide === 'front' ? (
                                       <div className="flex h-full items-center justify-center">
                                          <Loader2 className="h-6 w-6 animate-spin text-[#ff385c]" />
                                       </div>
                                    ) : (
                                       <div className="flex h-full flex-col items-center justify-center">
                                          <Upload className="h-5 w-5 text-zinc-400 group-hover:text-[#ff385c]" />
                                          <span className="group-hover:text-zinc-850 mt-1 text-xs font-bold text-zinc-500">
                                             Upload front photo
                                          </span>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* File upload back */}
                              <div>
                                 <label className="mb-2 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                    Back of Document (Optional)
                                 </label>
                                 <div className="group border-zinc-250 relative h-28 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-white hover:border-[#ff385c]/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900">
                                    <input
                                       type="file"
                                       accept="image/*"
                                       onChange={(e) => handlePhotoUpload(e, 'back')}
                                       className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                       disabled={uploadingSide !== null}
                                    />
                                    {backPhotoUrl ? (
                                       <>
                                          <img
                                             src={backPhotoUrl}
                                             alt="Back of document"
                                             className="absolute inset-0 h-full w-full object-cover"
                                          />
                                          <span className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow">
                                             <Check className="h-3 w-3 text-white" />
                                          </span>
                                       </>
                                    ) : uploadingSide === 'back' ? (
                                       <div className="flex h-full items-center justify-center">
                                          <Loader2 className="h-6 w-6 animate-spin text-[#ff385c]" />
                                       </div>
                                    ) : (
                                       <div className="flex h-full flex-col items-center justify-center">
                                          <Upload className="h-5 w-5 text-zinc-400 group-hover:text-[#ff385c]" />
                                          <span className="group-hover:text-zinc-850 mt-1 text-xs font-bold text-zinc-500">
                                             Upload back photo
                                          </span>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-xs text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/10">
                           <CheckCircle className="h-4 w-4 shrink-0" />
                           <span className="font-semibold">
                              Your identity is already verified on Rentify. Step 1 skipped.
                           </span>
                        </div>
                     )}
                  </div>

                  {/* Tax Regulations Section */}
                  <div className="space-y-6 rounded-3xl border border-zinc-200 bg-zinc-50/20 p-6 dark:border-zinc-800 dark:bg-zinc-900/10">
                     <div className="dark:border-zinc-850 flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c] dark:bg-rose-950/20">
                           <Percent className="h-5 w-5" />
                        </div>
                        <div>
                           <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              2. Tax Regulations
                           </h2>
                           <p className="text-zinc-550 dark:text-zinc-450 mt-0.5 text-xs">
                              Required for withholding compliance.
                           </p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <Input
                              label="Tax Residency Country"
                              value={taxCountry}
                              onChange={(e) => setTaxCountry(e.target.value.toUpperCase())}
                              maxLength={3}
                              placeholder="e.g. US, VN"
                              required
                           />

                           <Input
                              label="Tax Identification Number (TIN / SSN)"
                              value={taxId}
                              onChange={(e) => setTaxId(e.target.value)}
                              placeholder="e.g. 12-3456789"
                              required
                           />
                        </div>

                        <div>
                           <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                              Tax Form Type
                           </label>
                           <select
                              value={taxFormType}
                              onChange={(e) => setTaxFormType(e.target.value)}
                              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                           >
                              <option value="W-9">W-9 (US Citizen/Entity)</option>
                              <option value="W-8BEN">W-8BEN (Non-US Individual)</option>
                              <option value="W-8BEN-E">W-8BEN-E (Non-US Entity)</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* Payout Banking Section */}
                  <div className="space-y-6 rounded-3xl border border-zinc-200 bg-zinc-50/20 p-6 dark:border-zinc-800 dark:bg-zinc-900/10">
                     <div className="dark:border-zinc-850 flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c] dark:bg-rose-950/20">
                           <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                           <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              3. Link Payout Bank Account
                           </h2>
                           <p className="text-zinc-550 dark:text-zinc-450 mt-0.5 text-xs">
                              Where you will receive money from guest bookings.
                           </p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                              Payout Provider
                           </label>
                           <select
                              value={payoutProvider}
                              onChange={(e) => setPayoutProvider(e.target.value)}
                              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                           >
                              <option value="stripe">Stripe Connect Account</option>
                              <option value="bank_transfer">Direct Bank Transfer</option>
                           </select>
                        </div>

                        <Input
                           label="Bank Payout Account ID / IBAN / Account Number"
                           value={payoutAccountId}
                           onChange={(e) => setPayoutAccountId(e.target.value)}
                           placeholder="e.g. acct_1H234J56K78L90"
                           required
                        />
                     </div>
                  </div>

                  {/* Register Button */}
                  <Button
                     type="submit"
                     disabled={isRegistering || uploadingSide !== null}
                     className="h-12 w-full rounded-xl bg-[#ff385c] text-base font-extrabold text-white transition-colors hover:bg-[#ff385c]/90"
                  >
                     {isRegistering ? (
                        <div className="flex items-center justify-center gap-2">
                           <Loader2 className="h-5 w-5 animate-spin" />
                           <span>Processing Onboarding & KYC...</span>
                        </div>
                     ) : (
                        'Submit details & Register as Host'
                     )}
                  </Button>
               </form>
            </div>
         </main>
      </div>
   )
}
