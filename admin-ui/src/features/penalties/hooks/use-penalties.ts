import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPenalties, createPenalty, deletePenalty } from '../services/penalties-service'
import { CreatePenaltyRequest } from '../types'
import { toast } from 'react-hot-toast'

export function usePenaltiesQuery(page = 1, limit = 20, hostId?: string) {
   return useQuery({
      queryKey: ['penalties', page, limit, hostId],
      queryFn: () => getPenalties(page, limit, hostId),
      placeholderData: (prev) => prev
   })
}

export function usePenaltiesMutations() {
   const queryClient = useQueryClient()


   const create = useMutation({
      mutationFn: (data: CreatePenaltyRequest) => createPenalty(data),
      onSuccess: () => {
         toast.success('Penalty created successfully')
         queryClient.invalidateQueries({ queryKey: ['penalties'] })
      },
      onError: (error: any) => {
         toast.error(error?.response?.data?.message || 'Failed to create penalty')
      }
   })

   const remove = useMutation({
      mutationFn: (id: string) => deletePenalty(id),
      onSuccess: () => {
         toast.success('Penalty deleted successfully')
         queryClient.invalidateQueries({ queryKey: ['penalties'] })
      },
      onError: (error: any) => {
         toast.error(error?.response?.data?.message || 'Failed to delete penalty')
      }
   })

   return {
      createPenalty: create.mutate,
      isCreating: create.isPending,
      deletePenalty: remove.mutate,
      isDeleting: remove.isPending
   }
}
