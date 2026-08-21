import { apiClient } from '@/lib/api/api-client'
import {
   LedgerBalance,
   PaginatedPayouts,
   PaginatedTransactions,
   PlatformConfig,
   PayoutsFilter,
   TransactionsFilter
} from '../types'

export const ledgerService = {
   async getPlatformBalance(): Promise<{ balanceCents: number }> {
      const response = await apiClient.get('/ledger/accounts/balance', {
         params: {
            ownerType: 'platform',
            accountSubtype: 'revenue',
            currency: 'VND'
         }
      })
      return response.data?.data || { balanceCents: 0 }
   },

   async getTransactions(filter: TransactionsFilter = {}): Promise<PaginatedTransactions> {
      const params = new URLSearchParams()
      if (filter.type) params.set('type', filter.type)
      if (filter.bookingId) params.set('bookingId', filter.bookingId)
      if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.set('dateTo', filter.dateTo)
      if (filter.page) params.set('page', String(filter.page))
      if (filter.limit) params.set('limit', String(filter.limit))

      const response = await apiClient.get(`/admin/ledger/transactions?${params.toString()}`)
      return response.data?.data
   },

   async getBalances(): Promise<LedgerBalance[]> {
      const response = await apiClient.get('/admin/ledger/balances')
      return response.data?.data || []
   },

   async getPayouts(filter: PayoutsFilter = {}): Promise<PaginatedPayouts> {
      const params = new URLSearchParams()
      if (filter.hostId) params.set('hostId', filter.hostId)
      if (filter.status) params.set('status', filter.status)
      if (filter.scheduledForFrom) params.set('scheduledForFrom', filter.scheduledForFrom)
      if (filter.scheduledForTo) params.set('scheduledForTo', filter.scheduledForTo)
      if (filter.page) params.set('page', String(filter.page))
      if (filter.limit) params.set('limit', String(filter.limit))

      const response = await apiClient.get(`/admin/ledger/payouts?${params.toString()}`)
      return response.data?.data
   },

   async getPlatformConfig(): Promise<PlatformConfig> {
      const response = await apiClient.get('/admin/ledger/config')
      return response.data?.data
   },

   async updatePlatformConfig(feeRules: Record<string, unknown>): Promise<PlatformConfig> {
      const response = await apiClient.patch('/admin/ledger/config', { feeRules })
      return response.data?.data
   }
}
