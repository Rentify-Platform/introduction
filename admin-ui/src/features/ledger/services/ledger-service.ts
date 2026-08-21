import { apiClient } from '@/lib/api/api-client'

export interface PlatformBalance {
   ledgerAccountId: string
   balanceCents: string
   updatedAt: string
   currency: string
}

export const ledgerService = {
   async getPlatformBalance(): Promise<PlatformBalance> {
      const response = await apiClient.get<{ data: PlatformBalance }>(
         '/admin/ledger/platform-balance'
      )
      if (!response.data?.data) {
         throw new Error('Platform balance is unavailable')
      }
      return response.data.data
   }
}
