'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ledgerService } from '../services/ledger-service'
import { ledgerQueryKeys } from './use-ledger-queries'

export function useLedgerMutations() {
   const queryClient = useQueryClient()

   const updateConfigMutation = useMutation({
      mutationFn: (feeRules: Record<string, unknown>) =>
         ledgerService.updatePlatformConfig(feeRules),
      onSuccess: () => {
         toast.success('Platform fee rules updated successfully.')
         queryClient.invalidateQueries({ queryKey: ledgerQueryKeys.config() })
      },
      onError: () => {
         toast.error('Failed to update platform config. Please try again.')
      }
   })

   return {
      updateConfig: updateConfigMutation.mutate,
      isUpdatingConfig: updateConfigMutation.isPending
   }
}
