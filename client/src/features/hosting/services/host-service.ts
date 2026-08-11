import { apiClient } from '@/lib/api/api-client'
import { ApiResponse, User } from '@/features/auth/types'

export interface IdentityInput {
   docType: string
   countryCode?: string | null
   documentNumber?: string | null
   fileUrlFront: string
   fileUrlBack?: string | null
   issueDate?: string | null
   expiryDate?: string | null
}

export interface RegisterHostInput {
   identity?: IdentityInput | null
   taxCountry: string
   taxId: string
   taxFormType: string
   payoutProvider: string
   payoutAccountId: string
}

export interface RegisterHostResult {
   accountId: string
   kycStatus: string
   taxVerified: boolean
   payoutAccountVerified: boolean
   becameHostAt: string
}

export const hostService = {
   async register(data: RegisterHostInput): Promise<ApiResponse<RegisterHostResult>> {
      const response = await apiClient.post<ApiResponse<RegisterHostResult>>('/hosts/register', data)
      return response.data
   },

   async getProfile(): Promise<ApiResponse<unknown>> {
      const response = await apiClient.get<ApiResponse<unknown>>('/hosts/profile')
      return response.data
   }
}
