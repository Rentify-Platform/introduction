import { apiClient } from '@/lib/api/api-client'

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
   }
}
