'use client'

import * as React from 'react'
import {
   Users,
   Home as HomeIcon,
   Fingerprint,
   RefreshCw,
   DollarSign,
   ArrowUpRight,
   AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { useDashboardOverviewQuery, useRecentBookingsQuery } from '@/features/dashboard/hooks/use-dashboard-queries'
import { usePropertiesMutations } from '@/features/properties/hooks/use-properties-mutations'
import { formatVND } from '@/lib/utils'

export function OverviewDashboardContainer() {
   // Custom query and mutation hooks
   const { data: overviewData, isLoading: isLoadingOverview } = useDashboardOverviewQuery()
   const { data: recentBookings, isLoading: isLoadingBookings } = useRecentBookingsQuery()
   const { syncMeilisearch, isSyncing } = usePropertiesMutations()

   const kpis = [
      {
         title: 'Platform Revenue',
         value: isLoadingOverview ? 'Loading...' : formatVND(Number(overviewData?.platformRevenueCents || 0)),
         description: 'Cumulative transaction service fees',
         icon: DollarSign,
         color: 'text-emerald-600'
      },
      {
         title: 'Total Users',
         value: isLoadingOverview ? 'Loading...' : overviewData?.totalUsers.toString() || '0',
         description: 'Total registered accounts',
         icon: Users,
         color: 'text-blue-600'
      },
      {
         title: 'Active Listings',
         value: isLoadingOverview ? 'Loading...' : overviewData?.activeListings.toString() || '0',
         description: 'Properties available for booking',
         icon: HomeIcon,
         color: 'text-purple-600'
      },
      {
         title: 'Pending KYC Review',
         value: isLoadingOverview ? 'Loading...' : overviewData?.pendingKycCount.toString() || '0',
         description: 'Requires immediate review',
         icon: Fingerprint,
         color: 'text-amber-600'
      }
   ]

   const mockRecentBookings = recentBookings || []

   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         {/* Top Welcome & Quick Actions */}
         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                  Dashboard Overview
               </h2>
               <p className="text-sm text-zinc-500">
                  Real-time health, statistics, and platform utility controls.
               </p>
            </div>
            <div className="flex items-center gap-3">
               <Button
                  disabled={isSyncing}
                  onClick={() => syncMeilisearch()}
                  className="border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-900"
               >
                  {isSyncing ? (
                     <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Meilisearch
               </Button>
            </div>
         </div>

         {/* KPIs Grid */}
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => {
               const Icon = kpi.icon
               return (
                  <Card
                     key={idx}
                     className="border-zinc-200 bg-white shadow-xs transition-all duration-200 hover:border-zinc-300"
                  >
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                           {kpi.title}
                        </CardTitle>
                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                     </CardHeader>
                     <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">{kpi.value}</div>
                        <p className="mt-1 text-xs text-zinc-400">{kpi.description}</p>
                     </CardContent>
                  </Card>
               )
            })}
         </div>

         <div className="grid gap-6 md:grid-cols-2">
            {/* System Status & Quick Management Links */}
            <Card className="border-zinc-200 bg-white">
               <CardHeader>
                  <CardTitle className="text-lg text-zinc-900">Platform Admin Shortcuts</CardTitle>
                  <CardDescription className="text-zinc-500">
                     Direct system overrides and action buttons
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                     <div className="flex items-center gap-3">
                        <Fingerprint className="h-5 w-5 text-pink-500" />
                        <div>
                           <p className="text-sm font-semibold text-zinc-800">Manual KYC Queue</p>
                           <p className="text-xs text-zinc-500">
                              Review pending host & guest profile verifications
                           </p>
                        </div>
                     </div>
                     <Link
                        href="/kyc"
                        className={buttonVariants({
                           variant: 'default',
                           size: 'sm',
                           className: 'rounded-lg bg-pink-600 text-white hover:bg-pink-700'
                        })}
                     >
                        Review <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                     </Link>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                     <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                           <p className="text-sm font-semibold text-zinc-800">Bans & Suspensions</p>
                           <p className="text-xs text-zinc-500">
                              Manage account status and platform restrictions
                           </p>
                        </div>
                     </div>
                     <Link
                        href="/users"
                        className={buttonVariants({
                           variant: 'ghost',
                           size: 'sm',
                           className:
                              'rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                        })}
                     >
                        Manage <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                     </Link>
                  </div>
               </CardContent>
            </Card>

            {/* Recent Bookings Audits */}
            <Card className="border-zinc-200 bg-white">
               <CardHeader>
                  <CardTitle className="text-lg text-zinc-900">Recent Bookings</CardTitle>
                  <CardDescription className="text-zinc-500">
                     Latest bookings posted on the platform
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <Table className="border-zinc-200">
                     <TableHeader className="border-zinc-200">
                        <TableRow className="border-zinc-150 hover:bg-transparent">
                           <TableHead className="text-zinc-500">Guest</TableHead>
                           <TableHead className="text-zinc-500">Host</TableHead>
                           <TableHead className="text-zinc-500">Status</TableHead>
                           <TableHead className="text-right text-zinc-500">Amount</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {mockRecentBookings.map((b) => (
                           <TableRow key={b.id} className="border-zinc-100 hover:bg-zinc-50">
                              <TableCell className="font-medium text-zinc-900">{b.guest}</TableCell>
                              <TableCell className="text-zinc-700">{b.host}</TableCell>
                              <TableCell>
                                 <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                       b.status === 'confirmed'
                                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : b.status === 'pending'
                                            ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                            : 'border border-blue-200 bg-blue-50 text-blue-700'
                                    }`}
                                 >
                                    {b.status}
                                 </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-zinc-900">
                                 {formatVND(Number(b.amount))}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
         </div>
      </div>
   )
}
