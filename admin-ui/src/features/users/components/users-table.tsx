'use client'

import * as React from 'react'
import { Users2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { UserAccount, UsersFilter } from '@/features/users/types'
import { UserStatusBadge } from './user-status-badge'
import { UserActionsMenu } from './user-actions-menu'
import { formatDate } from '@/lib/utils'

interface UsersTableProps {
   users: UserAccount[]
   total: number
   filter: UsersFilter
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onFilterChange: (filter: UsersFilter) => void
   onUpdateStatus: (accountId: string, status: 'active' | 'suspended' | 'banned') => void
   isUpdatingStatus: boolean
}

const ROLE_LABELS: Record<string, string> = {
   guest: 'Guest',
   host: 'Host',
   admin: 'Admin'
}

export function UsersTable({
   users,
   total,
   filter,
   isLoading,
   isFetching,
   error,
   onFilterChange,
   onUpdateStatus,
   isUpdatingStatus
}: UsersTableProps) {
   const page = filter.page ?? 1
   const limit = filter.limit ?? 20
   const totalPages = Math.max(1, Math.ceil(total / limit))

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="text-lg text-zinc-900">Platform Accounts</CardTitle>
               <CardDescription className="text-zinc-500">
                  {total > 0 ? `${total} accounts found` : 'No accounts match the current filters'}
               </CardDescription>
            </div>
            {isFetching && !isLoading && (
               <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
            )}
         </CardHeader>

         <CardContent className="p-0">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading accounts…</p>
               </div>
            ) : error || users.length === 0 ? (
               <div className="py-16 text-center">
                  <Users2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No accounts found</p>
                  <p className="mt-1 text-xs text-zinc-400">
                     {error ? 'Failed to load data.' : 'Try adjusting your filters.'}
                  </p>
               </div>
            ) : (
               <>
                  <Table>
                     <TableHeader>
                        <TableRow className="border-zinc-200 hover:bg-transparent">
                           <TableHead className="text-zinc-500">User</TableHead>
                           <TableHead className="text-zinc-500">Phone</TableHead>
                           <TableHead className="text-zinc-500">Role</TableHead>
                           <TableHead className="text-zinc-500">KYC Status</TableHead>
                           <TableHead className="text-zinc-500">Status</TableHead>
                           <TableHead className="text-zinc-500">Joined</TableHead>
                           <TableHead className="w-12 text-zinc-500" />
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {users.map((user) => (
                           <TableRow key={user.id} className="border-zinc-100 hover:bg-zinc-50/50">
                              <TableCell>
                                 <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50 text-xs font-semibold text-pink-600">
                                       {user.firstName?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="min-w-0">
                                       <p className="truncate text-sm font-medium text-zinc-900">
                                          {user.firstName} {user.lastName}
                                       </p>
                                       <p className="truncate font-mono text-xs text-zinc-400">
                                          {user.email}
                                       </p>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-zinc-500">
                                 {user.phone ?? <span className="text-zinc-300">—</span>}
                              </TableCell>
                              <TableCell>
                                 <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                    {ROLE_LABELS[user.role] ?? user.role}
                                 </span>
                              </TableCell>
                              <TableCell>
                                 <span className="text-xs capitalize text-zinc-500">
                                    {user.guestKycStatus?.replace('_', ' ') ?? '—'}
                                 </span>
                              </TableCell>
                              <TableCell>
                                 <UserStatusBadge status={user.status} />
                              </TableCell>
                              <TableCell className="text-xs text-zinc-500">
                                 {formatDate(user.createdAt)}
                              </TableCell>
                              <TableCell>
                                 <UserActionsMenu
                                    user={user}
                                    onUpdateStatus={onUpdateStatus}
                                    isLoading={isUpdatingStatus}
                                 />
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                     <p className="text-xs text-zinc-500">
                        Page {page} of {totalPages} — {total} total
                     </p>
                     <div className="flex items-center gap-1">
                        <Button
                           id="users-prev-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page <= 1 || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page - 1 })}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           id="users-next-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page >= totalPages || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page + 1 })}
                        >
                           <ChevronRight className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
               </>
            )}
         </CardContent>
      </Card>
   )
}
