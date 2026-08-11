'use client'

import * as React from 'react'
import { FileText, ExternalLink, Loader2, ShieldCheck, ShieldX, Clock } from 'lucide-react'
import { usePropertyLicenseQuery } from '@/features/properties/hooks/use-properties-queries'
import { PropertyLicense } from '@/features/properties/types'

interface PropertyLicenseDrawerProps {
   propertyId: string | null
   propertyTitle: string
   onClose: () => void
}

const LICENSE_STATUS_CONFIG: Record<
   NonNullable<PropertyLicense['status']>,
   { label: string; icon: React.ElementType; className: string }
> = {
   pending: {
      label: 'Pending Review',
      icon: Clock,
      className: 'text-amber-600 bg-amber-50 border border-amber-200'
   },
   verified: {
      label: 'Verified',
      icon: ShieldCheck,
      className: 'text-emerald-600 bg-emerald-50 border border-emerald-200'
   },
   rejected: {
      label: 'Rejected',
      icon: ShieldX,
      className: 'text-rose-600 bg-rose-50 border border-rose-200'
   },
   expired: {
      label: 'Expired',
      icon: ShieldX,
      className: 'text-zinc-500 bg-zinc-50 border border-zinc-200'
   }
}

export function PropertyLicenseDrawer({
   propertyId,
   propertyTitle,
   onClose
}: PropertyLicenseDrawerProps) {
   const { data: license, isLoading } = usePropertyLicenseQuery(propertyId)

   if (!propertyId) return null

   const statusConfig = license ? LICENSE_STATUS_CONFIG[license.status] : null
   const StatusIcon = statusConfig?.icon ?? FileText

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-end"
         role="dialog"
         aria-modal="true"
         aria-label={`License for ${propertyTitle}`}
      >
         {/* Backdrop */}
         <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
         />

         {/* Panel */}
         <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
               <div>
                  <h2 className="text-base font-semibold text-zinc-900">License Document</h2>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{propertyTitle}</p>
               </div>
               <button
                  id="close-license-drawer"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Close"
               >
                  ✕
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                     <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                     <p className="text-sm">Loading license…</p>
                  </div>
               ) : !license ? (
                  <div className="py-16 text-center">
                     <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                     <p className="text-sm font-medium text-zinc-500">No license submitted</p>
                     <p className="mt-1 text-xs text-zinc-400">
                        The host has not submitted a license for this property yet.
                     </p>
                  </div>
               ) : (
                  <div className="space-y-5">
                     {/* Status */}
                     <div
                        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${statusConfig?.className}`}
                     >
                        <StatusIcon className="h-4 w-4" />
                        {statusConfig?.label}
                     </div>

                     {/* Details */}
                     <dl className="space-y-4">
                        {license.licenseNumber && (
                           <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                 License Number
                              </dt>
                              <dd className="mt-1 font-mono text-sm text-zinc-800">
                                 {license.licenseNumber}
                              </dd>
                           </div>
                        )}

                        {license.issuingAuthority && (
                           <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                 Issuing Authority
                              </dt>
                              <dd className="mt-1 text-sm text-zinc-800">{license.issuingAuthority}</dd>
                           </div>
                        )}

                        {license.expiryDate && (
                           <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                 Expiry Date
                              </dt>
                              <dd className="mt-1 text-sm text-zinc-800">
                                 {new Date(license.expiryDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                 })}
                              </dd>
                           </div>
                        )}

                        {license.verifiedAt && (
                           <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                 Verified At
                              </dt>
                              <dd className="mt-1 text-sm text-zinc-800">
                                 {new Date(license.verifiedAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                 })}
                              </dd>
                           </div>
                        )}

                        <div>
                           <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                              Submitted
                           </dt>
                           <dd className="mt-1 text-sm text-zinc-800">
                              {new Date(license.createdAt).toLocaleDateString('en-GB', {
                                 day: '2-digit',
                                 month: 'short',
                                 year: 'numeric'
                              })}
                           </dd>
                        </div>
                     </dl>

                     {/* File link */}
                     {license.fileUrl && (
                        <a
                           href={license.fileUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           id="view-license-file"
                           className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-100"
                        >
                           <ExternalLink className="h-4 w-4" />
                           View License Document
                        </a>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   )
}
