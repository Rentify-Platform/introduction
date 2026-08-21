import { useQuery } from '@tanstack/react-query'
import { ledgerService } from '../services/ledger-service'
import { PayoutsFilter, TransactionsFilter } from '../types'

export const ledgerQueryKeys = {
   all: ['ledger'] as const,
   platformBalance: () => [...ledgerQueryKeys.all, 'platform-balance'] as const,
   transactions: (filter: TransactionsFilter) =>
      [...ledgerQueryKeys.all, 'transactions', filter] as const,
   balances: () => [...ledgerQueryKeys.all, 'balances'] as const,
   payouts: (filter: PayoutsFilter) => [...ledgerQueryKeys.all, 'payouts', filter] as const,
   config: () => [...ledgerQueryKeys.all, 'config'] as const
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

export function useTransactionQueries(filter: TransactionsFilter) {
   const listQuery = useQuery({
      queryKey: ledgerQueryKeys.transactions(filter),
      queryFn: () => ledgerService.getTransactions(filter),
      placeholderData: (prev) => prev
   })

   return {
      transactions: listQuery.data?.data ?? [],
      total: listQuery.data?.total ?? 0,
      page: listQuery.data?.page ?? 1,
      limit: listQuery.data?.limit ?? 20,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error
   }
}

export function useBalanceQueries() {
   const listQuery = useQuery({
      queryKey: ledgerQueryKeys.balances(),
      queryFn: () => ledgerService.getBalances()
   })

   return {
      balances: listQuery.data ?? [],
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error,
      refetch: listQuery.refetch
   }
}

export function usePayoutQueries(filter: PayoutsFilter) {
   const listQuery = useQuery({
      queryKey: ledgerQueryKeys.payouts(filter),
      queryFn: () => ledgerService.getPayouts(filter),
      placeholderData: (prev) => prev
   })

   return {
      payouts: listQuery.data?.data ?? [],
      total: listQuery.data?.total ?? 0,
      page: listQuery.data?.page ?? 1,
      limit: listQuery.data?.limit ?? 20,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error
   }
}

export function usePlatformConfigQuery() {
   const configQuery = useQuery({
      queryKey: ledgerQueryKeys.config(),
      queryFn: () => ledgerService.getPlatformConfig()
   })

   return {
      config: configQuery.data ?? null,
      isLoading: configQuery.isLoading,
      error: configQuery.error
   }
}
