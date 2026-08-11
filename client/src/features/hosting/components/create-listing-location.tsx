'use client'

import * as React from 'react'
import { MapPin, Search, AlertTriangle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CreateListingLocationProps {
   addressLine1: string
   setAddressLine1: (v: string) => void
   addressLine2: string
   setAddressLine2: (v: string) => void
   city: string
   setCity: (v: string) => void
   stateProvince: string
   setStateProvince: (v: string) => void
   countryCode: string
   setCountryCode: (v: string) => void
   postalCode: string
   setPostalCode: (v: string) => void
   latitude: number
   setLatitude: (v: number) => void
   longitude: number
   setLongitude: (v: number) => void
}

export function CreateListingLocation({
   addressLine1,
   setAddressLine1,
   addressLine2,
   setAddressLine2,
   city,
   setCity,
   stateProvince,
   setStateProvince,
   countryCode,
   setCountryCode,
   postalCode,
   setPostalCode,
   latitude,
   setLatitude,
   longitude,
   setLongitude
}: CreateListingLocationProps) {
   const containerRef = React.useRef<HTMLDivElement>(null)
   const mapContainerRef = React.useRef<HTMLDivElement>(null)
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const mapRef = React.useRef<any>(null)
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const markerRef = React.useRef<any>(null)

   // Search states
   const [searchQuery, setSearchQuery] = React.useState('')
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const [suggestions, setSuggestions] = React.useState<any[]>([])
   const [showSuggestions, setShowSuggestions] = React.useState(false)
   const [searching, setSearching] = React.useState(false)

   const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

   // 1. Mapbox Geocoding Feature parser
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const parseMapboxFeature = React.useCallback((feature: any) => {
      const context = feature.context || []

      const houseNumber = feature.address || ''
      const street = feature.text || ''
      let streetAddress = houseNumber ? `${houseNumber} ${street}`.trim() : street

      if (!streetAddress) {
         streetAddress = feature.place_name?.split(',')[0] || ''
      }

      let cityVal = ''
      let stateVal = ''
      let countryVal = 'US'
      let postalCodeVal = ''

      // Parse Mapbox context list
      for (const ctx of context) {
         const id = ctx.id || ''
         if (id.startsWith('place') || id.startsWith('locality') || id.startsWith('district')) {
            cityVal = ctx.text
         }
         if (id.startsWith('region')) {
            stateVal = ctx.text
         }
         if (id.startsWith('country')) {
            countryVal = (ctx.short_code || 'US').toUpperCase()
         }
         if (id.startsWith('postcode')) {
            postalCodeVal = ctx.text
         }
      }

      if (!cityVal) {
         cityVal = feature.place_name?.split(',')[1]?.trim() || ''
      }

      return {
         addressLine1: streetAddress,
         city: cityVal,
         stateProvince: stateVal,
         countryCode: countryVal.substring(0, 2),
         postalCode: postalCodeVal,
         lat: feature.geometry.coordinates[1],
         lon: feature.geometry.coordinates[0]
      }
   }, [])

   // 2. Reverse Geocoding handler using Mapbox REST API
   const reverseGeocode = React.useCallback(
      async (lat: number, lon: number) => {
         if (!accessToken) return
         try {
            const res = await fetch(
               `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${accessToken}`
            )
            if (!res.ok) return
            const data = await res.json()
            if (data && data.features && data.features.length > 0) {
               const primaryFeature = data.features[0]
               const parsed = parseMapboxFeature(primaryFeature)
               setAddressLine1(parsed.addressLine1)
               setCity(parsed.city)
               setStateProvince(parsed.stateProvince)
               setCountryCode(parsed.countryCode)
               setPostalCode(parsed.postalCode)
               setSearchQuery(primaryFeature.place_name)
            }
         } catch (err) {
            console.error('Reverse geocoding error:', err)
         }
      },
      [
         accessToken,
         parseMapboxFeature,
         setAddressLine1,
         setCity,
         setCountryCode,
         setPostalCode,
         setStateProvince
      ]
   )

   // 3. Load Mapbox JS/CSS dynamically and initialize map canvas
   React.useEffect(() => {
      if (typeof window === 'undefined' || !accessToken) return

      const initializeMapbox = () => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const mapboxgl = (window as any).mapboxgl
         if (!mapboxgl || !mapContainerRef.current || mapRef.current) return

         mapboxgl.accessToken = accessToken

         const initialLat = latitude || 21.0285
         const initialLng = longitude || 105.8542

         const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [initialLng, initialLat], // Mapbox uses [lng, lat] format
            zoom: 14
         })

         const marker = new mapboxgl.Marker({ draggable: true })
            .setLngLat([initialLng, initialLat])
            .addTo(map)

         mapRef.current = map
         markerRef.current = marker

         // Map Drag Marker coordinates sync hook
         marker.on('dragend', async () => {
            const lngLat = marker.getLngLat()
            setLatitude(lngLat.lat)
            setLongitude(lngLat.lng)
            await reverseGeocode(lngLat.lat, lngLat.lng)
         })

         // Map click pin reposition hook
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         map.on('click', async (e: any) => {
            const { lng, lat } = e.lngLat
            marker.setLngLat([lng, lat])
            setLatitude(lat)
            setLongitude(lng)
            await reverseGeocode(lat, lng)
         })
      }

      const loadMapbox = () => {
         // CSS Link
         if (!document.getElementById('mapbox-css')) {
            const link = document.createElement('link')
            link.id = 'mapbox-css'
            link.rel = 'stylesheet'
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css'
            document.head.appendChild(link)
         }

         // JS Script
         if (!document.getElementById('mapbox-js')) {
            const script = document.createElement('script')
            script.id = 'mapbox-js'
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.js'
            script.async = true
            script.onload = () => {
               initializeMapbox()
            }
            document.head.appendChild(script)
         } else if (typeof window !== 'undefined' && 'mapboxgl' in window) {
            initializeMapbox()
         }
      }

      loadMapbox()

      return () => {
         if (mapRef.current) {
            mapRef.current.remove()
            mapRef.current = null
            markerRef.current = null
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [accessToken])

   // 4. Synchronize Map View and Marker with outside coordinates state changes
   React.useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapboxgl = (window as any).mapboxgl
      if (mapboxgl && mapRef.current && markerRef.current && latitude && longitude) {
         markerRef.current.setLngLat([longitude, latitude])
         mapRef.current.panTo([longitude, latitude])
      }
   }, [latitude, longitude])

   // 5. Query Mapbox Places predictions with 400ms debounce
   React.useEffect(() => {
      if (!accessToken || searchQuery.trim().length < 3) {
         return
      }

      const delayDebounce = setTimeout(async () => {
         setSearching(true)
         try {
            const res = await fetch(
               `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                  searchQuery
               )}.json?access_token=${accessToken}&autocomplete=true&limit=5`
            )
            if (res.ok) {
               const data = await res.json()
               setSuggestions(data.features || [])
            }
         } catch (err) {
            console.error('Mapbox search API error:', err)
         } finally {
            setSearching(false)
         }
      }, 400)

      return () => clearTimeout(delayDebounce)
   }, [searchQuery, accessToken])

   // Close search dropdown on click outside
   React.useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setShowSuggestions(false)
         }
      }
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
   }, [])

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const handleSelectSuggestion = (item: any) => {
      const parsed = parseMapboxFeature(item)
      setAddressLine1(parsed.addressLine1)
      setCity(parsed.city)
      setStateProvince(parsed.stateProvince)
      setCountryCode(parsed.countryCode)
      setPostalCode(parsed.postalCode)
      setLatitude(parsed.lat)
      setLongitude(parsed.lon)
      setSearchQuery(item.place_name)
      setShowSuggestions(false)

      if (mapRef.current && markerRef.current) {
         markerRef.current.setLngLat([parsed.lon, parsed.lat])
         mapRef.current.panTo([parsed.lon, parsed.lat])
         mapRef.current.setZoom(16)
      }
   }

   return (
      <section
         id="location"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <MapPin className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Location Details</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Search address to auto-fill details, or click on the map.
               </p>
            </div>
         </div>

         <div className="space-y-4" ref={containerRef}>
            {/* Mapbox Token Missing Notice */}
            {!accessToken && (
               <div className="border-rose-250 dark:border-rose-850 mb-5 flex items-start gap-3 rounded-2xl border bg-rose-50/50 p-4 text-xs dark:bg-rose-950/20">
                  <AlertTriangle className="dark:text-rose-450 h-4.5 w-4.5 shrink-0 text-rose-600" />
                  <div>
                     <p className="font-extrabold text-rose-800 dark:text-rose-300">
                        Mapbox Access Token Required
                     </p>
                     <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Please configure your Mapbox Access Token
                        (`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`) in your `.env` file to enable address
                        search and the interactive location selection map.
                     </p>
                  </div>
               </div>
            )}

            {/* Autocomplete Search input */}
            <div className="relative">
               <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-550 text-xs font-bold dark:text-zinc-400">
                     Search Address
                  </label>
                  <div className="relative flex items-center">
                     <input
                        type="text"
                        placeholder="Search for an address (e.g. 32 Dien Bien Phu...)"
                        disabled={!accessToken}
                        value={searchQuery}
                        onChange={(e) => {
                           const val = e.target.value
                           setSearchQuery(val)
                           if (val.trim().length < 3) {
                              setSuggestions([])
                           }
                           setShowSuggestions(true)
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="disabled:bg-zinc-105 h-10 w-full rounded-xl border border-zinc-200 bg-white pr-10 pl-4 text-sm focus:border-[#ff385c] focus:outline-none disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900 dark:disabled:bg-zinc-950"
                     />
                     <div className="absolute right-3 flex items-center justify-center text-zinc-400">
                        {searching ? (
                           <Loader2 className="h-4 w-4 animate-spin text-[#ff385c]" />
                        ) : (
                           <Search className="h-4 w-4" />
                        )}
                     </div>
                  </div>
               </div>

               {/* Suggestions Dropdown list */}
               {showSuggestions && suggestions.length > 0 && (
                  <div className="dark:border-zinc-850 absolute right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:bg-zinc-900">
                     {suggestions.map((item) => (
                        <button
                           key={item.id}
                           type="button"
                           onClick={() => handleSelectSuggestion(item)}
                           className="flex w-full cursor-pointer flex-col rounded-lg px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                           <span className="text-zinc-855 line-clamp-1 text-xs font-bold dark:text-zinc-200">
                              {item.text || item.place_name.split(',')[0]}
                           </span>
                           <span className="text-zinc-450 mt-0.5 line-clamp-1 text-[10px] dark:text-zinc-500">
                              {item.place_name}
                           </span>
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Mapbox Div Container */}
            {accessToken && (
               <div
                  ref={mapContainerRef}
                  className="dark:border-zinc-850 relative z-0 h-64 w-full overflow-hidden rounded-2xl border border-zinc-200"
                  style={{ minHeight: '260px' }}
               />
            )}

            <Input
               label="Address Line 1"
               placeholder="Street address, P.O. box"
               value={addressLine1}
               onChange={(e) => setAddressLine1(e.target.value)}
               required
            />
            <Input
               label="Address Line 2 (Optional)"
               placeholder="Apartment, suite, unit, building, floor"
               value={addressLine2}
               onChange={(e) => setAddressLine2(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
               <Input
                  label="City"
                  placeholder="e.g. Hanoi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
               />
               <Input
                  label="State / Province"
                  placeholder="e.g. Ba Dinh"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input
                  label="Country Code (2 Letters)"
                  placeholder="e.g. VN"
                  maxLength={2}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  required
               />
               <Input
                  label="Postal Code"
                  placeholder="e.g. 100000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
               />
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
               <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
               />
               <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
               />
            </div>
         </div>
      </section>
   )
}
