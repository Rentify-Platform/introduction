'use client'

import * as React from 'react'
import { Info, MapPin, Users, Tv, Camera, DollarSign, LucideIcon } from 'lucide-react'

interface Section {
   id: string
   label: string
   icon: LucideIcon
}

const SECTIONS: Section[] = [
   { id: 'basic-info', label: 'Basic Information', icon: Info },
   { id: 'location', label: 'Location Details', icon: MapPin },
   { id: 'capacity', label: 'Capacity & Layout', icon: Users },
   { id: 'amenities', label: 'Amenities', icon: Tv },
   { id: 'photos', label: 'Listing Photos', icon: Camera },
   { id: 'pricing', label: 'Pricing & Terms', icon: DollarSign }
]

interface CreateListingSidebarProps {
   activeSection: string
   onSectionClick: (id: string) => void
}

export function CreateListingSidebar({ activeSection, onSectionClick }: CreateListingSidebarProps) {
   return (
      <div className="sticky top-24 space-y-1.5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
         <p className="px-3 pb-3 text-xs font-black tracking-wider text-zinc-400 uppercase">
            Sections
         </p>
         {SECTIONS.map((sec) => {
            const Icon = sec.icon
            const isActive = activeSection === sec.id
            return (
               <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSectionClick(sec.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold transition-all ${
                     isActive
                        ? 'bg-[#ff385c]/10 text-[#ff385c]'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                  }`}
               >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#ff385c]' : ''}`} />
                  {sec.label}
               </button>
            )
         })}
      </div>
   )
}
