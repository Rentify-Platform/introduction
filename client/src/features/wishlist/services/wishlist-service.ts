import { apiClient } from '@/lib/api/api-client'
import { ApiResponse } from '@/features/auth/types'
import { Wishlist, CreateWishlistInput } from '../types'

export const wishlistService = {
   async getWishlists(): Promise<ApiResponse<Wishlist[]>> {
      const response = await apiClient.get<ApiResponse<Wishlist[]>>('/wishlists')
      return response.data
   },

   async getWishlistDetails(id: string): Promise<ApiResponse<Wishlist>> {
      const response = await apiClient.get<ApiResponse<Wishlist>>(`/wishlists/${id}`)
      return response.data
   },

   async createWishlist(data: CreateWishlistInput): Promise<ApiResponse<Wishlist>> {
      const response = await apiClient.post<ApiResponse<Wishlist>>('/wishlists', data)
      return response.data
   },

   async addWishlistItem(wishlistId: string, propertyId: string): Promise<ApiResponse<Wishlist>> {
      const response = await apiClient.post<ApiResponse<Wishlist>>(
         `/wishlists/${wishlistId}/properties/${propertyId}`
      )
      return response.data
   },

   async removeWishlistItem(
      wishlistId: string,
      propertyId: string
   ): Promise<ApiResponse<Wishlist>> {
      const response = await apiClient.delete<ApiResponse<Wishlist>>(
         `/wishlists/${wishlistId}/properties/${propertyId}`
      )
      return response.data
   }
}
