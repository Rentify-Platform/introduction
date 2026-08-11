'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
   MapPin,
   Bed,
   Bath,
   Eye,
   Pause,
   Play,
   Archive,
   Pencil,
   DollarSign,
   RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Listing } from '@/features/listings/types'
import { formatPrice } from '@/lib/format/price'

interface HostListingCardProps {
   listing: Listing
   onPublish: (id: string) => Promise<void>
   onPause: (id: string) => Promise<void>
   onArchive: (id: string) => Promise<void>
   onRestore: (id: string) => Promise<void>
   publishPending: boolean
   pausePending: boolean
   archivePending: boolean
   restorePending: boolean
}

const STATUS_CONFIG: Record<
   string,
   { label: string; dot: string; badge: string }
> = {
   active: {
      label: 'Active',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
   },
   paused: {
      label: 'Paused',
      dot: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
   },
   draft: {
      label: 'Draft',
      dot: 'bg-zinc-400',
      badge: 'bg-zinc-100 text-zinc-600 border-zinc-200'
   },
   archived: {
      label: 'Archived',
      dot: 'bg-rose-400',
      badge: 'bg-rose-50 text-rose-700 border-rose-200'
   }
}

export function HostListingCard({
   listing,
   onPublish,
   onPause,
   onArchive,
   onRestore,
   publishPending,
   pausePending,
   archivePending,
   restorePending
}: HostListingCardProps) {
   const thumbnail =
      listing.photoUrls?.[0] ??
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'

   const status = listing.status?.toLowerCase() ?? 'draft'
   const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

   return (
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-sm transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">

         {/* ── Thumbnail ── */}
         <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
            <Image
               src={thumbnail}
               alt={listing.title}
               fill
               className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Status badge */}
            <span
               className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${cfg.badge}`}
            >
               <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
               {cfg.label}
            </span>

            {/* Price chip */}
            <span className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-extrabold text-[#222] shadow backdrop-blur-sm">
               {formatPrice(listing.price, listing.currency)}
               <span className="font-normal text-zinc-500">/night</span>
            </span>
         </div>

         {/* ── Info ── */}
         <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
               <h3 className="line-clamp-1 text-sm font-extrabold leading-snug text-[#222]">
                  {listing.title}
               </h3>
               <p className="mt-1 flex items-center gap-1 text-xs text-[#6a6a6a]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {listing.city}, {listing.countryCode}
               </p>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs font-medium text-[#6a6a6a]">
               <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-zinc-400" />
                  {listing.beds} bed{listing.beds > 1 ? 's' : ''}
               </span>
               <span className="h-3 w-px bg-zinc-200" />
               <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-zinc-400" />
                  {listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}
               </span>
            </div>
         </div>

         {/* ── Actions ── */}
         <div className="grid grid-cols-2 gap-2 border-t border-[#f2f2f2] p-3">

            {/* View — always shown */}
            <Link href={`/properties/${listing.id}`}>
               <Button
                  variant="outline"
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-[#dddddd] text-xs font-semibold text-[#222] hover:border-[#222] hover:bg-[#f7f7f7]"
               >
                  <Eye className="h-3.5 w-3.5" />
                  View
               </Button>
            </Link>

            {/* Edit — shown for all except archived, where we show Restore instead */}
            {status !== 'archived' ? (
               <Link href={`/hosting/${listing.id}/edit`}>
                  <Button
                     variant="outline"
                     className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-[#dddddd] text-xs font-semibold text-[#222] hover:border-[#222] hover:bg-[#f7f7f7]"
                  >
                     <Pencil className="h-3.5 w-3.5" />
                     Edit
                  </Button>
               </Link>
            ) : (
               <Button
                  onClick={() => onRestore(listing.id)}
                  disabled={restorePending}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
               >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
               </Button>
            )}

            {/* Active: Pause + Archive */}
            {status === 'active' && (
               <Button
                  onClick={() => onPause(listing.id)}
                  disabled={pausePending}
                  variant="outline"
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
               >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
               </Button>
            )}
            {status === 'active' && (
               <Button
                  onClick={() => onArchive(listing.id)}
                  disabled={archivePending}
                  variant="outline"
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
               >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
               </Button>
            )}

            {/* Draft / Paused: Publish + Archive */}
            {(status === 'paused' || status === 'draft') && (
               <Button
                  onClick={() => onPublish(listing.id)}
                  disabled={publishPending}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff385c] text-xs font-bold text-white hover:bg-[#e00b41] disabled:opacity-50"
               >
                  <Play className="h-3.5 w-3.5" />
                  Publish
               </Button>
            )}
            {(status === 'paused' || status === 'draft') && (
               <Button
                  onClick={() => onArchive(listing.id)}
                  disabled={archivePending}
                  variant="outline"
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
               >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
               </Button>
            )}
         </div>
      </article>
   )
}
