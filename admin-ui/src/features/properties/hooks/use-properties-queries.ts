import { useQuery } from '@tanstack/react-query'
import { propertiesService } from '../services/properties-service'
import { PropertiesFilter } from '../types'
import { getApiErrorStatus } from '@/lib/api/api-client'

export const propertiesQueryKeys = {
   all: ['properties'] as const,
   list: (filter: PropertiesFilter) => [...propertiesQueryKeys.all, 'list', filter] as const,
   license: (propertyId: string) => [...propertiesQueryKeys.all, 'license', propertyId] as const
}

export function usePropertiesQueries(filter: PropertiesFilter) {
   const listQuery = useQuery({
      queryKey: propertiesQueryKeys.list(filter),
      queryFn: () => propertiesService.getAll(filter),
      placeholderData: (prev) => prev
   })

   return {
      properties: listQuery.data?.data ?? [],
      total: listQuery.data?.total ?? 0,
      page: listQuery.data?.page ?? 1,
      limit: listQuery.data?.limit ?? 20,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      error: listQuery.error,
      isUnauthorized: getApiErrorStatus(listQuery.error) === 403,
      refetch: listQuery.refetch
   }
}

export function usePropertyLicenseQuery(propertyId: string | null) {
   return useQuery({
      queryKey: propertiesQueryKeys.license(propertyId ?? ''),
      queryFn: () => propertiesService.getPropertyLicense(propertyId!),
      enabled: !!propertyId
   })
}
