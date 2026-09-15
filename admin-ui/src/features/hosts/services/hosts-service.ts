import { apiClient } from '@/lib/api/api-client'
import { HostProfile, ToggleSuperhostRequest } from '../types'
import { PaginatedResponse } from '@/shared/types'
import { ApiResponse } from '@/features/auth/types'

export const getHosts = async (page = 1, limit = 20) => {
   const response = await apiClient.get<ApiResponse<PaginatedResponse<HostProfile>>>('/admin/hosts', {
      params: { page, limit }
   })
   return response.data?.data
}

export const toggleSuperhost = async (accountId: string, data: ToggleSuperhostRequest) => {
   const response = await apiClient.patch<ApiResponse<HostProfile>>(`/admin/hosts/${accountId}/superhost`, data)
   return response.data?.data
}
