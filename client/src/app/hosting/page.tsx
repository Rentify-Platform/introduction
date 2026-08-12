'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Home, LayoutGrid, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Listing } from '@/features/listings/types'
import { HostListingCard } from '@/features/hosting/components/host-listing-card'
import {
   useHostListings,
   usePublishListing,
   usePauseListing,
   useArchiveListing,
   useRestoreListing
} from '@/features/listings/hooks/use-listings-queries'
import toast from 'react-hot-toast'

type TabKey = 'all' | 'active' | 'paused' | 'draft' | 'archived'

const TABS: TabKey[] = ['all', 'active', 'paused', 'draft', 'archived']

const STATUS_COLOR: Record<string, string> = {
   active: 'bg-emerald-500',
   paused: 'bg-amber-400',
   draft: 'bg-zinc-400',
   archived: 'bg-rose-400'
}

export default function HostingPage() {
   const router = useRouter()
   const { isAuthenticated, user, isInitialized } = useAuthStore()

   const { data: listings, isLoading, isError, refetch } = useHostListings(isAuthenticated)

   const publishMutation = usePublishListing()
   const pauseMutation = usePauseListing()
   const archiveMutation = useArchiveListing()
   const restoreMutation = useRestoreListing()

   const [activeTab, setActiveTab] = React.useState<TabKey>('all')

   // Protect page
   React.useEffect(() => {
      if (isInitialized) {
         if (!isAuthenticated) {
            toast.error('Please log in to manage your listings.')
            router.push('/login?redirect=/hosting')
         } else if (user?.role !== 'host') {
            toast.error('Please complete host onboarding first.')
            router.push('/host')
         }
      }
   }, [isInitialized, isAuthenticated, user, router])

   if (!isInitialized || isLoading) {
      return (
         <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f7f7] font-sans">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff385c]" />
            <p className="text-sm font-medium text-zinc-400">Loading your listings…</p>
         </div>
      )
   }

   if (!isAuthenticated || !user) return null

   // Filter listings based on active tab
   const filteredListings =
      listings?.filter((l: Listing) =>
         activeTab === 'all' ? true : l.status.toLowerCase() === activeTab
      ) ?? []

   // Per-tab counts for badge display
   const countByTab = (tab: TabKey) =>
      tab === 'all'
         ? (listings?.length ?? 0)
         : (listings?.filter((l: Listing) => l.status.toLowerCase() === tab).length ?? 0)

   const handlePublish = async (id: string) => {
      try {
         await publishMutation.mutateAsync(id)
         toast.success('Listing published!')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to publish.')
      }
   }

   const handlePause = async (id: string) => {
      try {
         await pauseMutation.mutateAsync(id)
         toast.success('Listing paused.')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to pause.')
      }
   }

   const handleArchive = async (id: string) => {
      try {
         await archiveMutation.mutateAsync(id)
         toast.success('Listing archived.')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to archive.')
      }
   }

   const handleRestore = async (id: string) => {
      try {
         await restoreMutation.mutateAsync(id)
         toast.success('Listing restored to draft.')
         refetch()
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Failed to restore.')
      }
   }

   const firstName = user.firstName ?? 'Host'

   return (
      <div className="min-h-screen bg-[#f7f7f7] font-sans">

         {/* ── Top bar ── */}
         <header className="sticky top-0 z-30 border-b border-[#ebebeb] bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">

               {/* Left — logo + breadcrumb */}
               <div className="flex items-center gap-3 min-w-0">
                  <Link
                     href="/"
                     className="flex shrink-0 items-center gap-1.5 text-[#ff385c] transition-opacity hover:opacity-70"
                     title="Back to homepage"
                  >
                     <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current" aria-hidden="true">
                        <path d="M16 1C10.5 1 5.3 5.2 5.3 11.3c0 7.4 9.3 18.2 10.1 19.1.2.3.5.4.6.4s.4-.1.6-.4C17.4 29.5 26.7 18.7 26.7 11.3 26.7 5.2 21.5 1 16 1zm0 15c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                     </svg>
                     <span className="text-base font-black tracking-tight">rentify</span>
                  </Link>

                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />

                  <span className="truncate text-sm font-semibold text-zinc-700">
                     Hosting
                  </span>
               </div>

               {/* Center — Navigation Tabs */}
               <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                  <Link href="/hosting" className="text-zinc-900 border-b-2 border-zinc-900 pb-1">
                     Properties
                  </Link>
                  <Link href="/hosting/reservations" className="text-zinc-500 hover:text-zinc-950 pb-1">
                     Reservations
                  </Link>
               </nav>

               {/* Right — CTA */}
               <Link href="/hosting/create">
                  <Button className="flex items-center gap-1.5 rounded-xl bg-[#ff385c] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e00b41] active:bg-[#c01030]">
                     <Plus className="h-4 w-4" />
                     New listing
                  </Button>
               </Link>
            </div>
         </header>

         {/* ── Page hero ── */}
         <section className="border-b border-[#ebebeb] bg-white px-6 py-8">
            <div className="mx-auto max-w-7xl">
               <p className="text-xs font-semibold uppercase tracking-widest text-[#ff385c]">
                  Host Dashboard
               </p>
               <h1 className="mt-1 text-3xl font-black tracking-tight text-[#222222]">
                  Welcome back, {firstName} 👋
               </h1>
               <p className="mt-1 text-sm text-[#6a6a6a]">
                  Manage, publish, and monitor all your properties in one place.
               </p>

               {/* Stats strip */}
               {listings && listings.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                     {(
                        [
                           { label: 'Total', key: 'all', color: 'bg-zinc-900' },
                           { label: 'Active', key: 'active', color: 'bg-emerald-500' },
                           { label: 'Paused', key: 'paused', color: 'bg-amber-400' },
                           { label: 'Draft', key: 'draft', color: 'bg-zinc-400' },
                           { label: 'Archived', key: 'archived', color: 'bg-rose-400' }
                        ] as { label: string; key: TabKey; color: string }[]
                     ).map(({ label, key, color }) => {
                        const n = countByTab(key)
                        if (key !== 'all' && n === 0) return null
                        return (
                           <button
                              key={key}
                              onClick={() => setActiveTab(key)}
                              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                 activeTab === key
                                    ? 'border-[#222] bg-[#222] text-white shadow-sm'
                                    : 'border-[#dddddd] bg-white text-[#3f3f3f] hover:border-[#bbb] hover:bg-[#f7f7f7]'
                              }`}
                           >
                              <span className={`h-2 w-2 rounded-full ${color}`} />
                              {label}
                              <span className={`ml-0.5 tabular-nums ${activeTab === key ? 'text-zinc-300' : 'text-zinc-400'}`}>
                                 {n}
                              </span>
                           </button>
                        )
                     })}
                  </div>
               )}
            </div>
         </section>

         {/* ── Content ── */}
         <main className="mx-auto max-w-7xl px-6 py-8">

            {/* Tab row (compact, for quick switching when hero is scrolled past) */}
            <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
               {TABS.map((tab) => {
                  const n = countByTab(tab)
                  return (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                           activeTab === tab
                              ? 'border-[#222] bg-[#222] text-white'
                              : 'border-transparent text-[#6a6a6a] hover:bg-white hover:text-[#222]'
                        }`}
                     >
                        {tab !== 'all' && (
                           <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[tab] ?? 'bg-zinc-400'}`} />
                        )}
                        {tab}
                        {n > 0 && (
                           <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                              {n}
                           </span>
                        )}
                     </button>
                  )
               })}
            </div>

            {/* Error state */}
            {isError && (
               <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
                  <p className="text-sm font-semibold text-red-600">Failed to load your listings.</p>
                  <Button
                     onClick={() => refetch()}
                     className="rounded-xl bg-[#222] px-5 py-2 text-xs font-bold text-white hover:bg-zinc-700"
                  >
                     Try again
                  </Button>
               </div>
            )}

            {/* Empty state */}
            {!isError && filteredListings.length === 0 && (
               <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#ebebeb] bg-white px-8 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f7f7] text-[#ff385c]">
                     <LayoutGrid className="h-7 w-7" />
                  </div>
                  <div>
                     <h2 className="text-base font-bold text-[#222]">No listings yet</h2>
                     <p className="mt-1 max-w-xs text-sm text-[#6a6a6a]">
                        {activeTab === 'all'
                           ? "You haven't created any listings. Get started and reach your first guest."
                           : `No ${activeTab} listings found. Try switching tabs.`}
                     </p>
                  </div>
                  {activeTab === 'all' && (
                     <Link href="/hosting/create">
                        <Button className="flex items-center gap-2 rounded-xl bg-[#ff385c] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e00b41]">
                           <Plus className="h-4 w-4" />
                           Create your first listing
                        </Button>
                     </Link>
                  )}
               </div>
            )}

            {/* Listings grid */}
            {!isError && filteredListings.length > 0 && (
               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredListings.map((listing: Listing, index: number) => (
                     <HostListingCard
                        key={listing.id}
                        listing={listing}
                        onPublish={handlePublish}
                        onPause={handlePause}
                        onArchive={handleArchive}
                        onRestore={handleRestore}
                        publishPending={publishMutation.isPending}
                        pausePending={pauseMutation.isPending}
                        archivePending={archiveMutation.isPending}
                        restorePending={restoreMutation.isPending}
                        priority={index < 4}
                        loading={index < 4 ? 'eager' : undefined}
                     />
                  ))}
               </div>
            )}
         </main>
      </div>
   )
}
