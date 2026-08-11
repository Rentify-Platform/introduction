import { apiClient } from '@/lib/api/api-client'
import { ApiResponse } from '@/features/auth/types'
import { BookingInput, Booking } from '../types'

export const bookingsService = {
   async createBooking(data: BookingInput): Promise<ApiResponse<Booking>> {
      const response = await apiClient.post<ApiResponse<Booking>>('/bookings', data)
      return response.data
   },

   async getBookingDetails(id: string): Promise<ApiResponse<Booking>> {
      const response = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`)
      return response.data
   },

   async getGuestBookings(): Promise<ApiResponse<Booking[]>> {
      const response = await apiClient.get<ApiResponse<Booking[]>>('/bookings/guest')
      return response.data
   },

   async cancelBooking(id: string, reason?: string): Promise<ApiResponse<Booking>> {
      const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason })
      return response.data
   },

   async getBookedDates(propertyId: string): Promise<ApiResponse<string[]>> {
      const response = await apiClient.get<ApiResponse<string[]>>(`/bookings/property/${propertyId}/booked-dates`)
      return response.data
   },

   async getHostBookings(): Promise<ApiResponse<Booking[]>> {
      const response = await apiClient.get<ApiResponse<Booking[]>>('/bookings/host')
      return response.data
   },

   async approveBooking(id: string): Promise<ApiResponse<Booking>> {
      const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/approve`)
      return response.data
   },

   async declineBooking(id: string, reason?: string): Promise<ApiResponse<Booking>> {
      const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/decline`, { reason })
      return response.data
   }
}
