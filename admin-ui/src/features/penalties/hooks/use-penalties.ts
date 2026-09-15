import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPenalties, createPenalty, voidPenalty } from '../services/penalties-service'
import { CreatePenaltyRequest } from '../types'
import { toast } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/api/api-client'

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
      onError: (error: unknown) => {
         toast.error(getApiErrorMessage(error, 'Failed to create penalty'))
      }
   })

   const voidMutation = useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => voidPenalty(id, reason),
      onSuccess: () => {
         toast.success('Penalty voided successfully')
         queryClient.invalidateQueries({ queryKey: ['penalties'] })
      },
      onError: (error: unknown) => {
         toast.error(getApiErrorMessage(error, 'Failed to void penalty'))
      }
   })

   return {
      createPenalty: create.mutate,
      isCreating: create.isPending,
      voidPenalty: voidMutation.mutate,
      isVoiding: voidMutation.isPending
   }
}
