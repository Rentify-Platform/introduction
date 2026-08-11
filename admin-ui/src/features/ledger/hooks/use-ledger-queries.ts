import { useQuery } from '@tanstack/react-query'
import { ledgerService } from '../services/ledger-service'

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
      errorBalance: balanceQuery.error
   }
}
