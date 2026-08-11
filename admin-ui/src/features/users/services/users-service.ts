import { apiClient } from '@/lib/api/api-client'
import { PaginatedUsers, UsersFilter } from '../types'

export const usersService = {
   async getAll(filter: UsersFilter = {}): Promise<PaginatedUsers> {
      const params = new URLSearchParams()
      if (filter.search) params.set('search', filter.search)
      if (filter.role) params.set('role', filter.role)
      if (filter.status) params.set('status', filter.status)
      if (filter.page) params.set('page', String(filter.page))
      if (filter.limit) params.set('limit', String(filter.limit))

      const response = await apiClient.get(`/admin/accounts?${params.toString()}`)
      return response.data?.data
   },

   async updateStatus(accountId: string, status: 'active' | 'suspended' | 'banned') {
      const response = await apiClient.patch(`/admin/accounts/${accountId}/status`, { status })
      return response.data?.data
   }
}
