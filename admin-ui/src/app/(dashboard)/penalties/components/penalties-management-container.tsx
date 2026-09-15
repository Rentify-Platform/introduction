'use client'

import * as React from 'react'
import { usePenaltiesQuery, usePenaltiesMutations } from '@/features/penalties/hooks/use-penalties'
import { PenaltiesTable } from '@/features/penalties/components/penalties-table'
import { AddPenaltyModal } from '@/features/penalties/components/add-penalty-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function PenaltiesManagementContainer() {
   const page = 1
   const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

   const { data } = usePenaltiesQuery(page, 20)
   const { voidPenalty, isVoiding } = usePenaltiesMutations()

   return (
      <div className="space-y-4">
         <div className="flex justify-end">
            <Button onClick={() => setIsAddModalOpen(true)}>
               <Plus className="mr-2 h-4 w-4" /> Add Penalty
            </Button>
         </div>

         <PenaltiesTable
            penalties={data?.data || []}
            onVoid={(id, reason, onSuccess) => voidPenalty({ id, reason }, { onSuccess })}
            isVoiding={isVoiding}
         />

         <AddPenaltyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      </div>
   )
}
