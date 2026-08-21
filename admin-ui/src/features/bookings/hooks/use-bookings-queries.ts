import { useQuery } from '@tanstack/react-query'
import { bookingsService } from '../services/bookings-service'
import { BookingsFilter } from '../types'

export const bookingsQueryKeys = {
   all: ['bookings'] as const,
   list: (filter: BookingsFilter) => [...bookingsQueryKeys.all, 'list', filter] as const
}

export function useBookingsQueries(filter: BookingsFilter) {
   const listQuery = useQuery({
      queryKey: bookingsQueryKeys.list(filter),
      queryFn: () => bookingsService.getAll(filter),
      placeholderData: (prev) => prev
   })

   return {
      bookings: listQuery.data?.data ?? [],
      total: listQuery.data?.total ?? 0,
      page: listQuery.data?.page ?? 1,
      limit: listQuery.data?.limit ?? 20,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error
   }
}
