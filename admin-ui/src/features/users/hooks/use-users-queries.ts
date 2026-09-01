import { useQuery } from '@tanstack/react-query'
import { usersService } from '../services/users-service'
import { UsersFilter } from '../types'
import { getApiErrorStatus } from '@/lib/api/api-client'

export const usersQueryKeys = {
   all: ['users'] as const,
   list: (filter: UsersFilter) => [...usersQueryKeys.all, 'list', filter] as const
}

export function useUsersQueries(filter: UsersFilter) {
   const listQuery = useQuery({
      queryKey: usersQueryKeys.list(filter),
      queryFn: () => usersService.getAll(filter),
      placeholderData: (prev) => prev
   })

   return {
      users: listQuery.data?.data ?? [],
      total: listQuery.data?.total ?? 0,
      page: listQuery.data?.page ?? 1,
      limit: listQuery.data?.limit ?? 20,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error,
      isUnauthorized: getApiErrorStatus(listQuery.error) === 403,
      refetch: listQuery.refetch
   }
}
