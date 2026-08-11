'use client'

import * as React from 'react'
import { useUsersQueries } from '@/features/users/hooks/use-users-queries'
import { useUsersMutations } from '@/features/users/hooks/use-users-mutations'
import { UsersFilterBar } from '@/features/users/components/users-filter-bar'
import { UsersTable } from '@/features/users/components/users-table'
import { UsersFilter } from '@/features/users/types'

export function UsersManagementContainer() {
   const [filter, setFilter] = React.useState<UsersFilter>({ page: 1, limit: 20 })

   const { users, total, page, limit, isLoading, isFetching, error } = useUsersQueries(filter)
   const { updateStatus, isUpdatingStatus } = useUsersMutations()

   return (
      <div className="space-y-4">
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
      </div>
   )
}
