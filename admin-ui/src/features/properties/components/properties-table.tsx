'use client'

import * as React from 'react'
import { Building2, Loader2, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
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
import { PropertySummary, PropertiesFilter } from '@/features/properties/types'
import { PropertyStatusBadge } from './property-status-badge'
import { PropertyActionsMenu } from './property-actions-menu'
import { formatDate } from '@/lib/utils'

interface PropertiesTableProps {
   properties: PropertySummary[]
   total: number
   filter: PropertiesFilter
   isLoading: boolean
   isFetching: boolean
   error: unknown
   onFilterChange: (filter: PropertiesFilter) => void
   onUpdateStatus: (propertyId: string, status: 'active' | 'paused' | 'archived') => void
   onViewLicense: (propertyId: string, title: string) => void
   isUpdatingStatus: boolean
}

const ROOM_TYPE_LABELS: Record<string, string> = {
   entire_place: 'Entire Place',
   private_room: 'Private Room',
   shared_room: 'Shared Room',
   hotel_room: 'Hotel Room'
}

export function PropertiesTable({
   properties,
   total,
   filter,
   isLoading,
   isFetching,
   error,
   onFilterChange,
   onUpdateStatus,
   onViewLicense,
   isUpdatingStatus
}: PropertiesTableProps) {
   const page = filter.page ?? 1
   const limit = filter.limit ?? 20
   const totalPages = Math.max(1, Math.ceil(total / limit))

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="text-lg text-zinc-900">Platform Properties</CardTitle>
               <CardDescription className="text-zinc-500">
                  {total > 0 ? `${total} properties found` : 'No properties match the current filters'}
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
                  <p className="text-sm">Loading properties…</p>
               </div>
            ) : error || properties.length === 0 ? (
               <div className="py-16 text-center">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No properties found</p>
                  <p className="mt-1 text-xs text-zinc-400">
                     {error ? 'Failed to load data.' : 'Try adjusting your filters.'}
                  </p>
               </div>
            ) : (
               <>
                  <Table>
                     <TableHeader>
                        <TableRow className="border-zinc-200 hover:bg-transparent">
                           <TableHead className="text-zinc-500">Property</TableHead>
                           <TableHead className="text-zinc-500">Room Type</TableHead>
                           <TableHead className="text-zinc-500">Guests</TableHead>
                           <TableHead className="text-zinc-500">Price</TableHead>
                           <TableHead className="text-zinc-500">Status</TableHead>
                           <TableHead className="text-zinc-500">Listed</TableHead>
                           <TableHead className="w-12 text-zinc-500" />
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {properties.map((property) => (
                           <TableRow
                              key={property.id}
                              className="border-zinc-100 hover:bg-zinc-50/50"
                           >
                              <TableCell>
                                 <div className="flex items-center gap-3">
                                    <img
                                       src={property.thumbnailUrl}
                                       alt={property.title}
                                       className="h-9 w-12 shrink-0 rounded-md object-cover"
                                    />
                                    <div className="min-w-0">
                                       <p className="truncate text-sm font-medium text-zinc-900">
                                          {property.title}
                                       </p>
                                       <p className="truncate text-xs text-zinc-400">
                                          {property.city}, {property.countryCode}
                                          {property.requiresLocalLicense && (
                                             <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-500">
                                                <Lock className="h-2.5 w-2.5" />
                                                License req.
                                             </span>
                                          )}
                                       </p>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <span className="text-xs text-zinc-500">
                                    {ROOM_TYPE_LABELS[property.roomType] ?? property.roomType}
                                 </span>
                              </TableCell>
                              <TableCell className="text-sm text-zinc-600">
                                 {property.maxGuests}
                              </TableCell>
                              <TableCell>
                                 <span className="font-mono text-sm text-zinc-800">
                                    {Number(property.basePriceCents).toLocaleString()}{' '}
                                    <span className="text-xs text-zinc-400">{property.currency}</span>
                                 </span>
                              </TableCell>
                              <TableCell>
                                 <PropertyStatusBadge status={property.status} />
                              </TableCell>
                              <TableCell className="text-xs text-zinc-500">
                                 {property.publishedAt
                                    ? formatDate(property.publishedAt)
                                    : formatDate(property.createdAt)}
                              </TableCell>
                              <TableCell>
                                 <PropertyActionsMenu
                                    property={property}
                                    onUpdateStatus={onUpdateStatus}
                                    onViewLicense={onViewLicense}
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
                           id="properties-prev-page"
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-zinc-600"
                           disabled={page <= 1 || isFetching}
                           onClick={() => onFilterChange({ ...filter, page: page - 1 })}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           id="properties-next-page"
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
