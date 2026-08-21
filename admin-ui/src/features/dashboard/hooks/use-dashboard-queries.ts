import { useQuery } from '@tanstack/react-query'
import { getDashboardOverview, getRecentBookings } from '../services/dashboard-service'

export function useDashboardOverviewQuery() {
   return useQuery({
      queryKey: ['dashboard', 'overview'],
      queryFn: getDashboardOverview
   })
}

export function useRecentBookingsQuery() {
   return useQuery({
      queryKey: ['dashboard', 'recent-bookings'],
      queryFn: getRecentBookings
   })
}
