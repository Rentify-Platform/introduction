import { apiClient } from '@/lib/api/api-client'
import { Penalty, CreatePenaltyRequest } from '../types'
import { PaginatedResponse } from '@/shared/types'

export const getPenalties = async (page = 1, limit = 20, hostId?: string) => {
   const response = await apiClient.get<PaginatedResponse<Penalty>>('/admin/penalties', {
      params: { page, limit, hostId }
   })
   return response.data
}

export const createPenalty = async (data: CreatePenaltyRequest) => {
   const response = await apiClient.post<{ id: string, amountCents: string }>('/admin/penalties', data)
   return response.data
}

export const deletePenalty = async (id: string) => {
   const response = await apiClient.delete(`/admin/penalties/${id}`)
   return response.data
}
