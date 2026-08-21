'use client'

import { ArrowUpRight, DollarSign, Fingerprint, Home as HomeIcon, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { useLedgerQueries } from '@/features/ledger/hooks/use-ledger-queries'
import { useUsersQueries } from '@/features/users/hooks/use-users-queries'
import { usePropertiesQueries } from '@/features/properties/hooks/use-properties-queries'
import { useKycQueries } from '@/features/kyc/hooks/use-kyc-queries'
import { formatVND } from '@/lib/utils'

interface MetricCardProps {
   title: string
   description: string
   icon: React.ElementType
   iconClassName: string
   value?: string
   isLoading: boolean
   error: unknown
   isUnauthorized: boolean
   emptyMessage?: string
   onRetry: () => void
}

function MetricCard({
   title,
   description,
   icon: Icon,
   iconClassName,
   value,
   isLoading,
   error,
   isUnauthorized,
   emptyMessage,
   onRetry
}: MetricCardProps) {
   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${iconClassName}`} />
         </CardHeader>
         <CardContent>
            {isLoading ? (
               <div aria-label={`Loading ${title}`} className="space-y-2">
                  <div className="h-8 w-28 animate-pulse rounded bg-zinc-200" />
                  <div className="h-3 w-40 animate-pulse rounded bg-zinc-100" />
               </div>
            ) : error ? (
               <div className="space-y-2">
                  <p className="text-sm font-medium text-rose-600">
                     {isUnauthorized ? 'Administrator access required' : `Unable to load ${title}`}
                  </p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                     Try Again
                  </Button>
               </div>
            ) : value === undefined ? (
               <p className="text-sm text-zinc-500">{emptyMessage || 'No data available'}</p>
            ) : (
               <>
                  <div className="text-2xl font-bold text-zinc-900">{value}</div>
                  <p className="mt-1 text-xs text-zinc-400">{description}</p>
               </>
            )}
         </CardContent>
      </Card>
   )
}

export function OverviewDashboardContainer() {
   const { balanceData, isLoadingBalance, errorBalance, isUnauthorizedBalance, refetchBalance } =
      useLedgerQueries()
   const usersQuery = useUsersQueries({ page: 1, limit: 1 })
   const propertiesQuery = usePropertiesQueries({ page: 1, limit: 1 })
   const kycQuery = useKycQueries()

   return (
      <div className="animate-in fade-in space-y-8 duration-300">
         <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard Overview</h2>
            <p className="text-sm text-zinc-500">Live operational data from Rentify APIs.</p>
         </div>

         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
               title="Platform Revenue"
               value={
                  balanceData
                     ? `${formatVND(Number(balanceData.balanceCents))} ${balanceData.currency}`
                     : undefined
               }
               description="Current platform revenue ledger balance"
               icon={DollarSign}
               iconClassName="text-emerald-600"
               isLoading={isLoadingBalance}
               error={errorBalance}
               isUnauthorized={isUnauthorizedBalance}
               emptyMessage="Platform balance is unavailable"
               onRetry={() => void refetchBalance()}
            />
            <MetricCard
               title="Total Users"
               value={usersQuery.error ? undefined : String(usersQuery.total)}
               description={usersQuery.total === 0 ? 'No user accounts yet' : 'Platform accounts'}
               icon={Users}
               iconClassName="text-blue-600"
               isLoading={usersQuery.isLoading}
               error={usersQuery.error}
               isUnauthorized={usersQuery.isUnauthorized}
               onRetry={() => void usersQuery.refetch()}
            />
            <MetricCard
               title="Total Properties"
               value={propertiesQuery.error ? undefined : String(propertiesQuery.total)}
               description={
                  propertiesQuery.total === 0 ? 'No properties yet' : 'Host property listings'
               }
               icon={HomeIcon}
               iconClassName="text-purple-600"
               isLoading={propertiesQuery.isLoading}
               error={propertiesQuery.error}
               isUnauthorized={propertiesQuery.isUnauthorized}
               onRetry={() => void propertiesQuery.refetch()}
            />
            <MetricCard
               title="Pending KYC"
               value={kycQuery.error ? undefined : String(kycQuery.pendingDocs.length)}
               description={
                  kycQuery.pendingDocs.length === 0
                     ? 'Review queue is empty'
                     : 'Submissions awaiting review'
               }
               icon={Fingerprint}
               iconClassName="text-amber-600"
               isLoading={kycQuery.isLoading}
               error={kycQuery.error}
               isUnauthorized={kycQuery.isUnauthorized}
               onRetry={() => void kycQuery.refetch()}
            />
         </div>

         <Card className="border-zinc-200 bg-white">
            <CardHeader>
               <CardTitle className="text-lg text-zinc-900">Admin Shortcuts</CardTitle>
               <CardDescription className="text-zinc-500">
                  Continue to the moderation areas included in this demo.
               </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
               {[
                  { href: '/users', label: 'Manage Users', icon: Users },
                  { href: '/properties', label: 'Review Properties', icon: HomeIcon },
                  { href: '/kyc', label: 'Review KYC Queue', icon: Fingerprint }
               ].map((shortcut) => {
                  const Icon = shortcut.icon
                  return (
                     <Link
                        key={shortcut.href}
                        href={shortcut.href}
                        className={buttonVariants({
                           variant: 'outline',
                           className: 'h-auto justify-between rounded-xl px-4 py-4'
                        })}
                     >
                        <span className="flex items-center gap-2">
                           <Icon className="h-4 w-4 text-pink-500" />
                           {shortcut.label}
                        </span>
                        <ArrowUpRight className="h-4 w-4" />
                     </Link>
                  )
               })}
            </CardContent>
         </Card>
      </div>
   )
}
