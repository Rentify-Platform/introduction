import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { VoidPenaltyDialog } from './void-penalty-dialog'

describe('VoidPenaltyDialog', () => {
   it('requires a reason and submits the trimmed reason', () => {
      const onConfirm = jest.fn()
      render(
         <VoidPenaltyDialog
            penaltyId="penalty-1"
            isOpen
            isPending={false}
            onClose={jest.fn()}
            onConfirm={onConfirm}
         />
      )

      const submit = screen.getByRole('button', { name: 'Void penalty' }) as HTMLButtonElement
      expect(submit.disabled).toBe(true)

      fireEvent.change(screen.getByLabelText('Reason'), {
         target: { value: '  created in error  ' }
      })
      expect(submit.disabled).toBe(false)
      fireEvent.click(submit)

      expect(onConfirm).toHaveBeenCalledWith('penalty-1', 'created in error')
   })

   it('does not render or submit without a penalty id', () => {
      const onConfirm = jest.fn()
      render(
         <VoidPenaltyDialog
            penaltyId={null}
            isOpen
            isPending={false}
            onClose={jest.fn()}
            onConfirm={onConfirm}
         />
      )

      expect(screen.queryByText('Void penalty')).toBeNull()
      expect(onConfirm).not.toHaveBeenCalled()
   })
})
