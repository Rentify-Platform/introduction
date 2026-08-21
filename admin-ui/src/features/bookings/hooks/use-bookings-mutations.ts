import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { bookingsService } from '../services/bookings-service'
import { bookingsQueryKeys } from './use-bookings-queries'

export function useBookingsMutations() {
   const queryClient = useQueryClient()

   const invalidate = () => queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.all })

   const approveMutation = useMutation({
      mutationFn: (bookingId: string) => bookingsService.approve(bookingId),
      onSuccess: () => {
         toast.success('Booking approved successfully.')
         invalidate()
      },
      onError: () => {
         toast.error('Failed to approve booking. Please try again.')
      }
   })

   const declineMutation = useMutation({
      mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
         bookingsService.decline(bookingId, reason),
      onSuccess: () => {
         toast.success('Booking declined successfully.')
         invalidate()
      },
      onError: () => {
         toast.error('Failed to decline booking. Please try again.')
      }
   })

   const cancelMutation = useMutation({
      mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
         bookingsService.cancel(bookingId, reason),
      onSuccess: () => {
         toast.success('Booking cancelled successfully.')
         invalidate()
      },
      onError: () => {
         toast.error('Failed to cancel booking. Please try again.')
      }
   })

   return {
      approve: approveMutation.mutate,
      decline: declineMutation.mutate,
      cancel: cancelMutation.mutate,
      isPending:
         approveMutation.isPending || declineMutation.isPending || cancelMutation.isPending
   }
}
