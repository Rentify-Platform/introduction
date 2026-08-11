import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsService } from '../services/listings-service'
import { SearchListingsParams } from '../types'

export const listingsQueryKeys = {
   all: ['listings'] as const,
   search: (params?: SearchListingsParams) => [...listingsQueryKeys.all, 'search', params] as const,
   detail: (id: string) => [...listingsQueryKeys.all, 'detail', id] as const,
   hostListings: () => [...listingsQueryKeys.all, 'host-listings'] as const
}

export function useSearchListings(params?: SearchListingsParams) {
   return useQuery({
      queryKey: listingsQueryKeys.search(params),
      queryFn: async () => {
         const response = await listingsService.searchListings(params)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to search listings')
      }
   })
}

export function useListingDetail(id: string) {
   return useQuery({
      queryKey: listingsQueryKeys.detail(id),
      queryFn: async () => {
         const response = await listingsService.getListingDetail(id)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch listing detail')
      },
      enabled: !!id
   })
}

export function useHostListings(enabled = true) {
   return useQuery({
      queryKey: listingsQueryKeys.hostListings(),
      queryFn: async () => {
         const response = await listingsService.getHostListings()
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch host listings')
      },
      enabled
   })
}

export function usePublishListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (id: string) => listingsService.publishListing(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
      }
   })
}

export function usePauseListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (id: string) => listingsService.pauseListing(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
      }
   })
}

export function useArchiveListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (id: string) => listingsService.archiveListing(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
      }
   })
}

export function useRestoreListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (id: string) => listingsService.restoreListing(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
      }
   })
}

import { CreateDraftListingInput } from '../types'

export function useCreateDraftListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (data: CreateDraftListingInput) => listingsService.createDraftListing(data),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
      }
   })
}

export function useUpdateListing() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: ({ id, data }: { id: string; data: CreateDraftListingInput }) =>
         listingsService.updateListing(id, data),
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.hostListings() })
         queryClient.invalidateQueries({ queryKey: listingsQueryKeys.detail(variables.id) })
      }
   })
}
