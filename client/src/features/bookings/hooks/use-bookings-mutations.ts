import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsService } from '../services/bookings-service'
import { BookingInput } from '../types'
import { bookingsQueryKeys } from './use-bookings-queries'

export function useCreateBooking() {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async (data: BookingInput) => {
         const response = await bookingsService.createBooking(data)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to create booking')
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({
            queryKey: bookingsQueryKeys.detail(data.id)
         })
      }
   })
}

export function useCancelBooking() {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
         const response = await bookingsService.cancelBooking(id, reason)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to cancel booking')
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({
            queryKey: bookingsQueryKeys.all
         })
      }
   })
}

export function useApproveBooking() {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async (id: string) => {
         const response = await bookingsService.approveBooking(id)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to approve booking')
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: bookingsQueryKeys.all
         })
      }
   })
}

export function useDeclineBooking() {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
         const response = await bookingsService.declineBooking(id, reason)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to decline booking')
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: bookingsQueryKeys.all
         })
      }
   })
}
