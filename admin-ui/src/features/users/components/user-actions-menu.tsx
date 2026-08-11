'use client'

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { UserAccount } from '@/features/users/types'
import { AlertTriangle, Ban, CheckCircle2, MoreHorizontal } from 'lucide-react'

interface UserActionsMenuProps {
   user: UserAccount
   onUpdateStatus: (accountId: string, status: 'active' | 'suspended' | 'banned') => void
   isLoading?: boolean
}

export function UserActionsMenu({ user, onUpdateStatus, isLoading }: UserActionsMenuProps) {
   const isActive = user.status === 'active'
   const isSuspended = user.status === 'suspended'
   const isBanned = user.status === 'banned'

   return (
      <DropdownMenu>
         <DropdownMenuTrigger
            id={`user-actions-${user.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-50"
            disabled={isLoading}
            aria-label={`Open actions for ${user.email}`}
         >
            <MoreHorizontal className="h-4 w-4" />
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-52">
            <p className="px-2 py-1 text-xs font-medium text-zinc-400">Account Actions</p>
            <DropdownMenuSeparator />

            {/* Reactivate — only shown when suspended or banned */}
            {!isActive && (
               <DropdownMenuItem
                  id={`activate-user-${user.id}`}
                  className="cursor-pointer gap-2 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                  onClick={() => onUpdateStatus(user.id, 'active')}
               >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Reactivate Account
               </DropdownMenuItem>
            )}

            {/* Suspend — only shown when active or banned */}
            {!isSuspended && (
               <DropdownMenuItem
                  id={`suspend-user-${user.id}`}
                  className="cursor-pointer gap-2 text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                  onClick={() => onUpdateStatus(user.id, 'suspended')}
               >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Suspend Account
               </DropdownMenuItem>
            )}

            {/* Ban — only shown when active or suspended */}
            {!isBanned && (
               <DropdownMenuItem
                  id={`ban-user-${user.id}`}
                  className="cursor-pointer gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                  onClick={() => onUpdateStatus(user.id, 'banned')}
               >
                  <Ban className="h-3.5 w-3.5" />
                  Ban Account
               </DropdownMenuItem>
            )}
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
