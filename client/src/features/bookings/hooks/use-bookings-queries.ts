import { useQuery } from '@tanstack/react-query'
import { bookingsService } from '../services/bookings-service'

export const bookingsQueryKeys = {
   all: ['bookings'] as const,
   detail: (id: string) => [...bookingsQueryKeys.all, 'detail', id] as const,
   bookedDates: (propertyId: string) => [...bookingsQueryKeys.all, 'booked-dates', propertyId] as const
}

export function useBookingDetail(
   id: string,
   options?: { enabled?: boolean; refetchInterval?: number | false }
) {
   return useQuery({
      queryKey: bookingsQueryKeys.detail(id),
      queryFn: async () => {
         const response = await bookingsService.getBookingDetails(id)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch booking details')
      },
      enabled: !!id && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval ?? false
   })
}

export function useGuestBookings() {
   return useQuery({
      queryKey: [...bookingsQueryKeys.all, 'guest'] as const,
      queryFn: async () => {
         const response = await bookingsService.getGuestBookings()
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch guest bookings')
      }
   })
}

export function useBookedDates(propertyId: string, options?: { enabled?: boolean }) {
   return useQuery({
      queryKey: bookingsQueryKeys.bookedDates(propertyId),
      queryFn: async () => {
         const response = await bookingsService.getBookedDates(propertyId)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch booked dates')
      },
      enabled: !!propertyId && (options?.enabled ?? true)
   })
}

export function useHostBookings() {
   return useQuery({
      queryKey: [...bookingsQueryKeys.all, 'host'] as const,
      queryFn: async () => {
         const response = await bookingsService.getHostBookings()
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch host bookings')
      }
   })
}
