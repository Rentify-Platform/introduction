import { apiClient } from '@/lib/api/api-client'
import { PaginatedProperties, PropertiesFilter, PropertyLicense } from '../types'

export const propertiesService = {
   async getAll(filter: PropertiesFilter = {}): Promise<PaginatedProperties> {
      const params = new URLSearchParams()
      if (filter.search) params.set('search', filter.search)
      if (filter.status) params.set('status', filter.status)
      if (filter.page) params.set('page', String(filter.page))
      if (filter.limit) params.set('limit', String(filter.limit))

      const response = await apiClient.get(`/admin/properties?${params.toString()}`)
      return response.data?.data
   },

   async getPropertyLicense(propertyId: string): Promise<PropertyLicense | null> {
      const response = await apiClient.get(`/admin/properties/${propertyId}/license`)
      return response.data?.data ?? null
   },

   async updateStatus(propertyId: string, status: 'active' | 'paused' | 'archived') {
      const response = await apiClient.patch(`/admin/properties/${propertyId}/status`, { status })
      return response.data?.data
   }
}
