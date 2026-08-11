'use client'

import * as React from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePropertiesQueries } from '@/features/properties/hooks/use-properties-queries'
import { usePropertiesMutations } from '@/features/properties/hooks/use-properties-mutations'
import { PropertiesFilterBar } from '@/features/properties/components/properties-filter-bar'
import { PropertiesTable } from '@/features/properties/components/properties-table'
import { PropertyLicenseDrawer } from '@/features/properties/components/property-license-drawer'
import { PropertiesFilter } from '@/features/properties/types'

export function PropertiesManagementContainer() {
   const [filter, setFilter] = React.useState<PropertiesFilter>({ page: 1, limit: 20 })
   const [licenseDrawer, setLicenseDrawer] = React.useState<{
      propertyId: string
      title: string
   } | null>(null)

   const { properties, total, page, limit, isLoading, isFetching, error } =
      usePropertiesQueries(filter)
   const { updateStatus, isUpdatingStatus, syncMeilisearch, isSyncing } = usePropertiesMutations()

   return (
      <div className="space-y-4">
         {/* Toolbar */}
         <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
               <PropertiesFilterBar filter={filter} onChange={setFilter} />
            </div>
            <Button
               id="sync-meilisearch-btn"
               variant="outline"
               size="sm"
               disabled={isSyncing}
               onClick={() => syncMeilisearch()}
               className="shrink-0 gap-1.5 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
               <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
               {isSyncing ? 'Syncing…' : 'Sync Search'}
            </Button>
         </div>

         {/* Table */}
         <PropertiesTable
            properties={properties}
            total={total}
            filter={{ ...filter, page, limit }}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            onFilterChange={setFilter}
            onUpdateStatus={(propertyId, status) => updateStatus({ propertyId, status })}
            onViewLicense={(propertyId, title) => setLicenseDrawer({ propertyId, title })}
            isUpdatingStatus={isUpdatingStatus}
         />

         {/* License Drawer */}
         {licenseDrawer && (
            <PropertyLicenseDrawer
               propertyId={licenseDrawer.propertyId}
               propertyTitle={licenseDrawer.title}
               onClose={() => setLicenseDrawer(null)}
            />
         )}
      </div>
   )
}
