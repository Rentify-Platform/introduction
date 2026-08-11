'use client'

import * as React from 'react'
import { Listing } from '@/features/listings/types'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/format/price'

interface SearchMapProps {
   properties: Listing[]
   center: { lat: number; lng: number } | null
   hoveredPropertyId?: string | null
}

export function SearchMap({ properties, center, hoveredPropertyId }: SearchMapProps) {
   const mapContainerRef = React.useRef<HTMLDivElement>(null)
   const mapRef = React.useRef<any>(null)
   const markersRef = React.useRef<{ propertyId: string; container: HTMLDivElement; element: HTMLDivElement; marker: any }[]>([])
   const router = useRouter()
   const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

   // 1. Load Mapbox JS and CSS
   React.useEffect(() => {
      if (!accessToken) return

      const initializeMap = () => {
         const mapboxgl = (window as any).mapboxgl
         if (!mapboxgl || !mapContainerRef.current || mapRef.current) return

         mapboxgl.accessToken = accessToken

         const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center ? [center.lng, center.lat] : [108.2772, 14.0583], // default to Vietnam center
            zoom: center ? 10.5 : 5.5
         })

         mapRef.current = map

         // Add navigation controls
         map.addControl(new mapboxgl.NavigationControl(), 'top-right')
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
               initializeMap()
            }
            document.head.appendChild(script)
         } else if (typeof window !== 'undefined' && 'mapboxgl' in window) {
            initializeMap()
         }
      }

      loadMapbox()

      return () => {
         if (mapRef.current) {
            mapRef.current.remove()
            mapRef.current = null
         }
      }
   }, [accessToken])

   // 2. Fly to new center when center changes
   React.useEffect(() => {
      if (mapRef.current && center) {
         mapRef.current.flyTo({
            center: [center.lng, center.lat],
            essential: true,
            zoom: 10.5
         })
      }
   }, [center])

   // 3. Update Markers when properties change
   React.useEffect(() => {
      const mapboxgl = (window as any).mapboxgl
      if (!mapRef.current || !mapboxgl) return

      // Clear existing markers
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []

      properties.forEach((property) => {
         const lat = Number(property.latitude)
         const lng = Number(property.longitude)
         if (isNaN(lat) || isNaN(lng)) return

         // Create custom HTML element for marker (capsule price tag)
         const el = document.createElement('div')
         el.className = 'price-marker-container'
         
         const pillEl = document.createElement('div')
         pillEl.className = 'px-2.5 py-1.5 rounded-full bg-white text-zinc-950 font-extrabold border border-zinc-300 shadow-md text-xs hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800'
         pillEl.innerText = formatPrice(property.price, property.currency).replace(' đ', ' ₫')
         
         el.appendChild(pillEl)

         // Create popup showing basic info on hover
         const stableRating = 4.5 + (parseInt(property.id.replace(/-/g, '').slice(0, 4), 16) % 50) / 100
         const ratingString = stableRating.toFixed(2)
         const fallbackImage = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=300&q=80'
         
         const popupHTML = `
            <div class="p-2 w-48 font-sans text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
               <img src="${property.thumbnailUrl || fallbackImage}" loading="eager" class="w-full h-24 object-cover rounded-md mb-2 pointer-events-none" />
               <div class="font-bold text-xs truncate mb-0.5">${property.title}</div>
               <div class="text-[10px] text-zinc-500 truncate mb-1.5">
                  ${property.roomType ? property.roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Entire Place'}
               </div>
               <div class="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-100 dark:border-zinc-850">
                  <span class="font-extrabold text-[#ff385c]">${formatPrice(property.price, property.currency).replace(' đ', ' ₫')} <span class="text-[9px] text-zinc-400 font-normal">/ night</span></span>
                  <span class="flex items-center gap-0.5 font-semibold text-zinc-800 dark:text-zinc-200">
                     ★ ${ratingString}
                  </span>
               </div>
            </div>
         `

         const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
            .setHTML(popupHTML)

         // Add marker and popup
         const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(mapRef.current)

         markersRef.current.push({
            propertyId: property.id,
            container: el,
            element: pillEl,
            marker
         })

         // Hover events
         el.addEventListener('mouseenter', () => {
            marker.togglePopup()
         })
         el.addEventListener('mouseleave', () => {
            if (popup.isOpen()) {
               marker.togglePopup()
            }
         })

         // Click to details redirect
         el.addEventListener('click', () => {
            router.push(`/properties/${property.id}`)
         })
      })
   }, [properties, router])

   // 4. Synchronize hovered listing card with price markers on the map
   React.useEffect(() => {
      markersRef.current.forEach(({ propertyId, container, element }) => {
         if (propertyId === hoveredPropertyId) {
            // Apply active styles (black background, white text, scale up, bring to front)
            element.classList.remove('bg-white', 'text-zinc-950', 'border-zinc-300', 'dark:bg-zinc-900', 'dark:text-zinc-50', 'dark:border-zinc-800')
            element.classList.add('bg-zinc-950', 'text-white', 'border-zinc-950', 'scale-110', 'dark:bg-white', 'dark:text-zinc-950', 'dark:border-white')
            container.style.zIndex = '99'
         } else {
            // Revert to default styles
            element.classList.remove('bg-zinc-950', 'text-white', 'border-zinc-950', 'scale-110', 'dark:bg-white', 'dark:text-zinc-950', 'dark:border-white')
            element.classList.add('bg-white', 'text-zinc-950', 'border-zinc-300', 'dark:bg-zinc-900', 'dark:text-zinc-50', 'dark:border-zinc-800')
            container.style.zIndex = '1'
         }
      })
   }, [hoveredPropertyId])

   return (
      <div className="relative w-full h-full">
         <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
   )
}
