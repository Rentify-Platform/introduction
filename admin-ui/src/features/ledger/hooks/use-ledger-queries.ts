import { useQuery } from '@tanstack/react-query'
import { ledgerService } from '../services/ledger-service'
import { getApiErrorStatus } from '@/lib/api/api-client'

export const ledgerQueryKeys = {
   all: ['ledger'] as const,
   platformBalance: () => [...ledgerQueryKeys.all, 'platform-balance'] as const
}

export function useLedgerQueries() {
   const balanceQuery = useQuery({
      queryKey: ledgerQueryKeys.platformBalance(),
      queryFn: () => ledgerService.getPlatformBalance()
   })

   return {
      balanceData: balanceQuery.data,
      isLoadingBalance: balanceQuery.isLoading,
      errorBalance: balanceQuery.error,
      isUnauthorizedBalance: getApiErrorStatus(balanceQuery.error) === 403,
      refetchBalance: balanceQuery.refetch
   }
}
