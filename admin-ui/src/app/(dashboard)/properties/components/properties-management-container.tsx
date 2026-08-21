'use client'

import * as React from 'react'
import { usePropertiesQueries } from '@/features/properties/hooks/use-properties-queries'
import { usePropertiesMutations } from '@/features/properties/hooks/use-properties-mutations'
import { PropertiesFilterBar } from '@/features/properties/components/properties-filter-bar'
import { PropertiesTable } from '@/features/properties/components/properties-table'
import { PropertyLicenseDrawer } from '@/features/properties/components/property-license-drawer'
import { PropertyStatusConfirmationDialog } from '@/features/properties/components/property-status-confirmation-dialog'
import { PropertiesFilter, PropertyStatus, PropertySummary } from '@/features/properties/types'

export function PropertiesManagementContainer() {
   const [filter, setFilter] = React.useState<PropertiesFilter>({ page: 1, limit: 20 })
   const [licenseDrawer, setLicenseDrawer] = React.useState<{
      propertyId: string
      title: string
   } | null>(null)
   const [pendingChange, setPendingChange] = React.useState<{
      property: PropertySummary
      status: Extract<PropertyStatus, 'active' | 'paused' | 'archived'>
   } | null>(null)

   const { properties, total, page, limit, isLoading, isFetching, error, isUnauthorized, refetch } =
      usePropertiesQueries(filter)
   const { updateStatus, isUpdatingStatus } = usePropertiesMutations()

   const confirmStatusChange = async () => {
      if (!pendingChange) return
      try {
         await updateStatus({
            propertyId: pendingChange.property.id,
            status: pendingChange.status
         })
         setPendingChange(null)
      } catch {
         // The mutation hook displays the backend error and refreshes stale data.
      }
   }

   return (
      <div className="space-y-4">
         <PropertiesFilterBar filter={filter} onChange={setFilter} />

         {/* Table */}
         <PropertiesTable
            properties={properties}
            total={total}
            filter={{ ...filter, page, limit }}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            isUnauthorized={isUnauthorized}
            onRetry={() => void refetch()}
            onFilterChange={setFilter}
            onRequestStatusChange={(property, status) => setPendingChange({ property, status })}
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

         <PropertyStatusConfirmationDialog
            property={pendingChange?.property ?? null}
            targetStatus={pendingChange?.status ?? null}
            isSubmitting={isUpdatingStatus}
            onCancel={() => setPendingChange(null)}
            onConfirm={() => void confirmStatusChange()}
         />
      </div>
   )
}
