'use client'

import * as React from 'react'
import { Loader2, Save, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlatformConfig } from '@/features/ledger/types'

interface PlatformConfigFormProps {
   config: PlatformConfig | null
   isLoading: boolean
   error: unknown
   onUpdate: (feeRules: Record<string, unknown>) => void
   isUpdating: boolean
}

export function PlatformConfigForm({
   config,
   isLoading,
   error,
   onUpdate,
   isUpdating
}: PlatformConfigFormProps) {
   const initialJson = React.useMemo(() => {
      if (!config?.feeRules) return '{}'
      return JSON.stringify(config.feeRules, null, 2)
   }, [config])

   const [value, setValue] = React.useState(initialJson)
   const [validationError, setValidationError] = React.useState<string | null>(null)
   const [trackedJson, setTrackedJson] = React.useState(initialJson)

   // Sync local form value when the server config changes (render-time adjustment)
   if (trackedJson !== initialJson) {
      setTrackedJson(initialJson)
      setValue(initialJson)
      setValidationError(null)
   }

   const handleChange = (next: string) => {
      setValue(next)
      try {
         const parsed: unknown = JSON.parse(next)
         if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            setValidationError('Fee rules must be a JSON object, e.g. {"default_pct": 12}')
            return
         }
         setValidationError(null)
      } catch {
         setValidationError('Invalid JSON — please fix the syntax before saving.')
      }
   }

   const handleSave = () => {
      if (validationError) return
      onUpdate(JSON.parse(value) as Record<string, unknown>)
   }

   return (
      <Card className="border-zinc-200 bg-white shadow-xs">
         <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 pb-4">
            <div>
               <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
                  <Settings2 className="h-4 w-4 text-pink-500" />
                  Platform Fee Rules
               </CardTitle>
               <CardDescription className="text-zinc-500">
                  {config
                     ? `Last updated ${new Date(config.updatedAt).toLocaleString('vi-VN')}`
                     : 'No configuration loaded yet'}
               </CardDescription>
            </div>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-pink-400" />}
         </CardHeader>

         <CardContent className="pt-6">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-sm">Loading configuration…</p>
               </div>
            ) : error ? (
               <div className="py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">Failed to load configuration</p>
                  <p className="mt-1 text-xs text-zinc-400">Please try refreshing the page.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  <textarea
                     id="fee-rules-json"
                     value={value}
                     onChange={(e) => handleChange(e.target.value)}
                     rows={12}
                     spellCheck={false}
                     className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm text-zinc-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  />
                  {validationError && (
                     <p className="text-xs font-medium text-rose-600">{validationError}</p>
                  )}
                  <div className="flex justify-end">
                     <Button
                        id="platform-config-save"
                        disabled={isUpdating || Boolean(validationError)}
                        onClick={handleSave}
                        className="bg-pink-600 text-white hover:bg-pink-700"
                     >
                        <Save className="mr-2 h-4 w-4" />
                        {isUpdating ? 'Saving…' : 'Save Fee Rules'}
                     </Button>
                  </div>
               </div>
            )}
         </CardContent>
      </Card>
   )
}
