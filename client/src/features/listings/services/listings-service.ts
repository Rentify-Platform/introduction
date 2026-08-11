import { apiClient } from '@/lib/api/api-client'
import { ApiResponse } from '@/features/auth/types'
import {
   SearchListingsParams,
   SearchListingsResponse,
   ListingDetail,
   Listing,
   CreateDraftListingInput
} from '../types'

export const listingsService = {
   async searchListings(
      params?: SearchListingsParams
   ): Promise<ApiResponse<SearchListingsResponse>> {
      // If amenities is an array, we serialize it to query string correctly
      const formattedParams = { ...params }
      if (Array.isArray(formattedParams.amenities)) {
         formattedParams.amenities = formattedParams.amenities.join(',')
      }

      const response = await apiClient.get<ApiResponse<SearchListingsResponse>>('/properties', {
         params: formattedParams
      })
      return response.data
   },

   async getListingDetail(id: string): Promise<ApiResponse<ListingDetail>> {
      const response = await apiClient.get<ApiResponse<ListingDetail>>(`/properties/detail/${id}`)
      return response.data
   },

   async getHostListings(): Promise<ApiResponse<Listing[]>> {
      const response = await apiClient.get<ApiResponse<Listing[]>>('/properties/host/my-listings')
      return response.data
   },

   async publishListing(id: string): Promise<ApiResponse<Listing>> {
      const response = await apiClient.post<ApiResponse<Listing>>(`/properties/${id}/publish`)
      return response.data
   },

   async pauseListing(id: string): Promise<ApiResponse<Listing>> {
      const response = await apiClient.post<ApiResponse<Listing>>(`/properties/${id}/pause`)
      return response.data
   },

   async archiveListing(id: string): Promise<ApiResponse<Listing>> {
      const response = await apiClient.post<ApiResponse<Listing>>(`/properties/${id}/archive`)
      return response.data
   },

   async restoreListing(id: string): Promise<ApiResponse<Listing>> {
      const response = await apiClient.post<ApiResponse<Listing>>(`/properties/${id}/restore`)
      return response.data
   },

   async createDraftListing(data: CreateDraftListingInput): Promise<ApiResponse<Listing>> {
      const response = await apiClient.post<ApiResponse<Listing>>('/properties/draft', data)
      return response.data
   },

   async updateListing(id: string, data: CreateDraftListingInput): Promise<ApiResponse<Listing>> {
      const response = await apiClient.patch<ApiResponse<Listing>>(`/properties/${id}`, data)
      return response.data
   }
}
