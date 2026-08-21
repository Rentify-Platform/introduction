import { apiClient } from '@/lib/api/api-client'
import { ApiResponse } from '@/features/auth/types'

export interface DashboardOverviewStats {
   totalUsers: number
   activeListings: number
   pendingKycCount: number
   platformRevenueCents: string
}

export interface RecentBooking {
   id: string
   guest: string
   host: string
   status: string
   amount: string
   date: string
}

export const getDashboardOverview = async (): Promise<DashboardOverviewStats> => {
   const response = await apiClient.get<ApiResponse<DashboardOverviewStats>>('/admin/stats/overview')
   return response.data?.data
}

export const getRecentBookings = async (): Promise<RecentBooking[]> => {
   const response = await apiClient.get<ApiResponse<RecentBooking[]>>('/admin/stats/recent-bookings')
   return response.data?.data
}
