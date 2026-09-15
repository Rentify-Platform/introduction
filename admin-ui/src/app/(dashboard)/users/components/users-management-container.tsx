'use client'

import * as React from 'react'
import { useUsersQueries } from '@/features/users/hooks/use-users-queries'
import { useUsersMutations } from '@/features/users/hooks/use-users-mutations'
import { UsersFilterBar } from '@/features/users/components/users-filter-bar'
import { UsersTable } from '@/features/users/components/users-table'
import { UserStatusConfirmationDialog } from '@/features/users/components/user-status-confirmation-dialog'
import { useHostsQuery } from '@/features/hosts/hooks/use-hosts'
import { HostsTable } from '@/features/hosts/components/hosts-table'
import { AccountStatus, UserAccount, UsersFilter } from '@/features/users/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function UsersManagementContainer() {
   const [filter, setFilter] = React.useState<UsersFilter>({ page: 1, limit: 20 })
   const [hostsPage] = React.useState(1)
   const [pendingChange, setPendingChange] = React.useState<{
      user: UserAccount
      status: AccountStatus
   } | null>(null)

   const { users, total, page, limit, isLoading, isFetching, error, isUnauthorized, refetch } =
      useUsersQueries(filter)
   const { updateStatus, isUpdatingStatus } = useUsersMutations()

   const { data: hostsData } = useHostsQuery(hostsPage, 20)

   const confirmStatusChange = async () => {
      if (!pendingChange) return
      try {
         await updateStatus({
            accountId: pendingChange.user.id,
            status: pendingChange.status
         })
         setPendingChange(null)
      } catch {
         // The mutation hook displays the backend error and refreshes stale data.
      }
   }

   return (
      <div className="space-y-4">
         <Tabs defaultValue="all" className="w-full">
            <TabsList>
               <TabsTrigger value="all">All Users</TabsTrigger>
               <TabsTrigger value="hosts">Hosts & Superhosts</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
               <UsersFilterBar filter={filter} onChange={setFilter} />

               <UsersTable
                  users={users}
                  total={total}
                  filter={{ ...filter, page, limit }}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  error={error}
                  isUnauthorized={isUnauthorized}
                  onRetry={() => void refetch()}
                  onFilterChange={setFilter}
                  onRequestStatusChange={(user, status) => setPendingChange({ user, status })}
                  isUpdatingStatus={isUpdatingStatus}
               />
            </TabsContent>

            <TabsContent value="hosts" className="mt-4 space-y-4">
               <HostsTable hosts={hostsData?.data || []} />
            </TabsContent>
         </Tabs>

         <UserStatusConfirmationDialog
            user={pendingChange?.user ?? null}
            targetStatus={pendingChange?.status ?? null}
            isSubmitting={isUpdatingStatus}
            onCancel={() => setPendingChange(null)}
            onConfirm={() => void confirmStatusChange()}
         />
      </div>
   )
}
