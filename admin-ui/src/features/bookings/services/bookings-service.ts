import { apiClient } from '@/lib/api/api-client'
import { BookingsFilter, PaginatedBookings } from '../types'

export const bookingsService = {
   async getAll(filter: BookingsFilter = {}): Promise<PaginatedBookings> {
      const params = new URLSearchParams()
      if (filter.search) params.set('search', filter.search)
      if (filter.status) params.set('status', filter.status)
      if (filter.page) params.set('page', String(filter.page))
      if (filter.limit) params.set('limit', String(filter.limit))

      const response = await apiClient.get(`/admin/bookings?${params.toString()}`)
      return response.data?.data
   },

   async getById(id: string) {
      const response = await apiClient.get(`/admin/bookings/${id}`)
      return response.data?.data
   },

   async approve(id: string) {
      const response = await apiClient.post(`/admin/bookings/${id}/approve`)
      return response.data?.data
   },

   async decline(id: string, reason?: string) {
      const response = await apiClient.post(`/admin/bookings/${id}/decline`, { reason })
      return response.data?.data
   },

   async cancel(id: string, reason?: string) {
      const response = await apiClient.post(`/admin/bookings/${id}/cancel`, { reason })
      return response.data?.data
   }
}
