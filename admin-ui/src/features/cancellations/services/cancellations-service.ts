import { apiClient } from '@/lib/api/api-client'
import { Cancellation, CancellationOverrideRequest } from '../types'
import { PaginatedResponse } from '@/shared/types'
import { ApiResponse } from '@/features/auth/types'

export const getCancellations = async (page = 1, limit = 20, propertyId?: string) => {
   const response = await apiClient.get<ApiResponse<PaginatedResponse<Cancellation>>>('/admin/cancellations', {
      params: { page, limit, propertyId }
   })
   return response.data?.data
}

export const overrideCancellation = async (data: CancellationOverrideRequest) => {
   const response = await apiClient.post<ApiResponse<any>>(`/admin/bookings/${data.bookingId}/override-cancellation`, data)
   return response.data?.data
}
