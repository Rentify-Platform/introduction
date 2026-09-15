import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { BookingStatusBadge } from './booking-status-badge'
import { BookingStatus } from '../types'

describe('BookingStatusBadge', () => {
   it.each<[BookingStatus, string]>([
      ['pending', 'Pending'],
      ['pending_approval', 'Pending Approval'],
      ['confirmed', 'Confirmed'],
      ['cancelled_by_guest', 'Cancelled by Guest'],
      ['cancelled_by_host', 'Cancelled by Host'],
      ['cancelled_by_admin', 'Cancelled by Admin'],
      ['completed', 'Completed'],
      ['expired', 'Expired']
   ])('renders label "%s" for status %s', (status, label) => {
      render(<BookingStatusBadge status={status} />)
      expect(screen.getByText(label)).toBeTruthy()
   })

   it('renders a dedicated label for cancelled_by_admin (Phase 7 regression)', () => {
      render(<BookingStatusBadge status="cancelled_by_admin" />)
      const badge = screen.getByText('Cancelled by Admin')
      expect(badge.textContent).toBe('Cancelled by Admin')
      // Không được rơi về nhãn chung "Cancelled" của client — admin phải phân biệt được actor
      expect(badge.textContent).not.toBe('Cancelled')
   })

   it('falls back to the raw status text for an unknown status', () => {
      render(<BookingStatusBadge status={'unknown_status' as BookingStatus} />)
      expect(screen.getByText('unknown_status')).toBeTruthy()
   })
})
