'use client'

import * as React from 'react'
import { useUsersQueries } from '@/features/users/hooks/use-users-queries'
import { useUsersMutations } from '@/features/users/hooks/use-users-mutations'
import { UsersFilterBar } from '@/features/users/components/users-filter-bar'
import { UsersTable } from '@/features/users/components/users-table'
import { UsersFilter } from '@/features/users/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostsQuery } from '@/features/hosts/hooks/use-hosts'
import { HostsTable } from '@/features/hosts/components/hosts-table'

export function UsersManagementContainer() {
   const [filter, setFilter] = React.useState<UsersFilter>({ page: 1, limit: 20 })
   const [hostsPage, setHostsPage] = React.useState(1)

   const { users, total, page, limit, isLoading, isFetching, error } = useUsersQueries(filter)
   const { updateStatus, isUpdatingStatus } = useUsersMutations()
   
   const { data: hostsData } = useHostsQuery(hostsPage, 20)

   return (
      <div className="space-y-4">
         <Tabs defaultValue="all" className="w-full">
            <TabsList>
               <TabsTrigger value="all">All Users</TabsTrigger>
               <TabsTrigger value="hosts">Hosts & Superhosts</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
               <UsersFilterBar filter={filter} onChange={setFilter} />

               <UsersTable
                  users={users}
                  total={total}
                  filter={{ ...filter, page, limit }}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  error={error}
                  onFilterChange={setFilter}
                  onUpdateStatus={(accountId, status) => updateStatus({ accountId, status })}
                  isUpdatingStatus={isUpdatingStatus}
               />
            </TabsContent>

            <TabsContent value="hosts" className="space-y-4 mt-4">
               <HostsTable hosts={hostsData?.data || []} />
            </TabsContent>
         </Tabs>
      </div>
   )
}
