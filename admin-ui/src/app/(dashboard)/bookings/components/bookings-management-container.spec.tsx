import * as React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { BookingsManagementContainer } from './bookings-management-container'

const mockCancel = jest.fn()
const mockApprove = jest.fn()
const mockDecline = jest.fn()

jest.mock('@/features/bookings/hooks/use-bookings-queries', () => ({
   useBookingsQueries: () => ({
      bookings: [],
      total: 0,
      page: 1,
      limit: 20,
      isLoading: false,
      isFetching: false,
      error: null
   })
}))

jest.mock('@/features/bookings/hooks/use-bookings-mutations', () => ({
   useBookingsMutations: () => ({
      approve: mockApprove,
      decline: mockDecline,
      cancel: mockCancel,
      isPending: false
   })
}))

jest.mock('@/features/cancellations/hooks/use-cancellations', () => ({
   useCancellationsQuery: () => ({ data: { data: [] } }),
   useOverrideCancellationMutation: () => ({ mutate: jest.fn(), isPending: false })
}))

jest.mock('@/features/bookings/components/bookings-filter-bar', () => ({
   BookingsFilterBar: () => <div data-testid="bookings-filter" />
}))

jest.mock('@/features/bookings/components/bookings-table', () => ({
   BookingsTable: ({ onCancel }: { onCancel: (bookingId: string) => void }) => (
      <button onClick={() => onCancel('booking-1')}>open cancel</button>
   )
}))

jest.mock('@/features/cancellations/components/cancellations-table', () => ({
   CancellationsTable: () => <div data-testid="cancellations-table" />
}))

jest.mock('@/features/cancellations/components/override-cancellation-modal', () => ({
   OverrideCancellationModal: () => null
}))

jest.mock('@/features/bookings/components/booking-cancel-modal', () => ({
   BookingCancelModal: ({
      bookingId,
      isOpen,
      onClose,
      onConfirm
   }: {
      bookingId: string | null
      isOpen: boolean
      onClose: () => void
      onConfirm: (bookingId: string, reason?: string) => void
   }) =>
      isOpen ? (
         <div data-testid="cancel-modal">
            <button onClick={() => onConfirm(bookingId!, 'admin reason')}>confirm cancel</button>
            <button onClick={onClose}>close cancel</button>
         </div>
      ) : null
}))

describe('BookingsManagementContainer', () => {
   beforeEach(() => {
      mockCancel.mockReset()
      mockApprove.mockReset()
      mockDecline.mockReset()
   })

   it('passes reason to cancel and closes the modal after successful mutation', () => {
      render(<BookingsManagementContainer />)

      fireEvent.click(screen.getByRole('button', { name: 'open cancel' }))
      expect(screen.getByTestId('cancel-modal')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'confirm cancel' }))

      expect(mockCancel).toHaveBeenCalledTimes(1)
      expect(mockCancel.mock.calls[0][0]).toEqual({
         bookingId: 'booking-1',
         reason: 'admin reason'
      })

      const mutationOptions = mockCancel.mock.calls[0][1] as { onSuccess: () => void }
      expect(mutationOptions.onSuccess).toEqual(expect.any(Function))
      act(() => mutationOptions.onSuccess())

      expect(screen.queryByTestId('cancel-modal')).toBeNull()
   })

   it('does not call cancel when the admin closes the modal', () => {
      render(<BookingsManagementContainer />)

      fireEvent.click(screen.getByRole('button', { name: 'open cancel' }))
      fireEvent.click(screen.getByRole('button', { name: 'close cancel' }))

      expect(mockCancel).not.toHaveBeenCalled()
      expect(screen.queryByTestId('cancel-modal')).toBeNull()
   })
})
