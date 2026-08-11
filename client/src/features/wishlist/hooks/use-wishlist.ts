import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistService } from '../services/wishlist-service'
import { CreateWishlistInput } from '../types'

export const wishlistQueryKeys = {
   all: ['wishlists'] as const,
   list: () => [...wishlistQueryKeys.all, 'list'] as const,
   detail: (id: string) => [...wishlistQueryKeys.all, 'detail', id] as const
}

export function useWishlists(enabled = true) {
   return useQuery({
      queryKey: wishlistQueryKeys.list(),
      queryFn: async () => {
         const response = await wishlistService.getWishlists()
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch wishlists')
      },
      enabled
   })
}

export function useWishlistDetails(id: string, enabled = true) {
   return useQuery({
      queryKey: wishlistQueryKeys.detail(id),
      queryFn: async () => {
         const response = await wishlistService.getWishlistDetails(id)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to fetch wishlist details')
      },
      enabled: enabled && !!id
   })
}

export function useCreateWishlist() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: async (data: CreateWishlistInput) => {
         const response = await wishlistService.createWishlist(data)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to create wishlist')
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list() })
      }
   })
}

export function useAddWishlistItem() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: async ({
         wishlistId,
         propertyId
      }: {
         wishlistId: string
         propertyId: string
      }) => {
         const response = await wishlistService.addWishlistItem(wishlistId, propertyId)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to add item to wishlist')
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list() })
         queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detail(variables.wishlistId) })
      }
   })
}

export function useRemoveWishlistItem() {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: async ({
         wishlistId,
         propertyId
      }: {
         wishlistId: string
         propertyId: string
      }) => {
         const response = await wishlistService.removeWishlistItem(wishlistId, propertyId)
         if (response.success && response.data) {
            return response.data
         }
         throw new Error(response.message || 'Failed to remove item from wishlist')
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list() })
         queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detail(variables.wishlistId) })
      }
   })
}
