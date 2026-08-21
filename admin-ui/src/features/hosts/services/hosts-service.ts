import { apiClient } from '@/lib/api/api-client'
import { HostProfile, ToggleSuperhostRequest } from '../types'
import { PaginatedResponse } from '@/shared/types'

export const getHosts = async (page = 1, limit = 20) => {
   const response = await apiClient.get<PaginatedResponse<HostProfile>>('/admin/hosts', {
      params: { page, limit }
   })
   return response.data
}

export const toggleSuperhost = async (accountId: string, data: ToggleSuperhostRequest) => {
   const response = await apiClient.patch(`/admin/hosts/${accountId}/superhost`, data)
   return response.data
}
