import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { BookingCancelModal } from './booking-cancel-modal'

function setup(overrides: Partial<React.ComponentProps<typeof BookingCancelModal>> = {}) {
   const onConfirm = jest.fn()
   const onClose = jest.fn()
   const props: React.ComponentProps<typeof BookingCancelModal> = {
      bookingId: 'booking-1',
      isOpen: true,
      isPending: false,
      onClose,
      onConfirm,
      ...overrides
   }
   const utils = render(<BookingCancelModal {...props} />)
   return { onConfirm, onClose, utils }
}

describe('BookingCancelModal', () => {
   it('sends the admin reason to onConfirm (Phase 7: admin cancel gửi reason)', () => {
      const { onConfirm } = setup()

      const textarea = screen.getByLabelText(/Reason/i) as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'Property removed from platform' } })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel Booking' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onConfirm).toHaveBeenCalledWith('booking-1', 'Property removed from platform')
   })

   it('sends undefined reason when the admin confirms with an empty reason', () => {
      const { onConfirm } = setup()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel Booking' }))

      expect(onConfirm).toHaveBeenCalledWith('booking-1', undefined)
   })

   it('does not send a whitespace-only reason (trims before sending)', () => {
      const { onConfirm } = setup()

      const textarea = screen.getByLabelText(/Reason/i) as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel Booking' }))

      expect(onConfirm).toHaveBeenCalledWith('booking-1', undefined)
   })

   it('closes without confirming when the admin keeps the booking (control case)', () => {
      const { onConfirm, onClose } = setup()

      fireEvent.click(screen.getByRole('button', { name: 'Keep Booking' }))

      expect(onConfirm).not.toHaveBeenCalled()
      expect(onClose).toHaveBeenCalledTimes(1)
   })

   it('disables actions and shows a pending label while the mutation is in flight', () => {
      setup({ isPending: true })

      const confirm = screen.getByRole('button', { name: 'Cancelling…' }) as HTMLButtonElement
      const keep = screen.getByRole('button', { name: 'Keep Booking' }) as HTMLButtonElement

      expect(confirm.disabled).toBe(true)
      expect(keep.disabled).toBe(true)
   })

   it('resets the reason field every time the modal re-opens (container remounts via key)', () => {
      const { utils } = setup()

      const textarea = screen.getByLabelText(/Reason/i) as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'stale reason' } })

      // Container truyền key={cancelBookingId ?? 'closed'}: đóng rồi mở lại booking khác
      // phải remount component với state mới thay vì giữ reason cũ
      utils.rerender(
         <BookingCancelModal
            key="closed"
            bookingId="booking-1"
            isOpen={false}
            isPending={false}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
         />
      )
      utils.rerender(
         <BookingCancelModal
            key="booking-2"
            bookingId="booking-2"
            isOpen
            isPending={false}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
         />
      )

      const reopened = screen.getByLabelText(/Reason/i) as HTMLTextAreaElement
      expect(reopened.value).toBe('')
   })
})
