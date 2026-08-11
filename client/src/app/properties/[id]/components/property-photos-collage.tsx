'use client'

import * as React from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PropertyPhotosCollageProps {
   photoUrls: string[]
   title: string
}

const FALLBACK_IMAGES = [
   'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
   'https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'
]

export function PropertyPhotosCollage({ photoUrls, title }: PropertyPhotosCollageProps) {
   const [isOpen, setIsOpen] = React.useState(false)
   const [currentIndex, setCurrentIndex] = React.useState(0)

   // Setup photos collage (exactly 5 items needed)
   const photos = [...photoUrls]
   while (photos.length < 5) {
      photos.push(FALLBACK_IMAGES[photos.length])
   }

   const openLightbox = (index: number) => {
      setCurrentIndex(index)
      setIsOpen(true)
   }

   const closeLightbox = () => {
      setIsOpen(false)
   }

   const nextImage = React.useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
   }, [photos.length])

   const prevImage = React.useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
   }, [photos.length])

   // Keyboard Navigation
   React.useEffect(() => {
      if (!isOpen) return

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'ArrowRight') nextImage()
         if (e.key === 'ArrowLeft') prevImage()
         if (e.key === 'Escape') closeLightbox()
      }

      window.addEventListener('keydown', handleKeyDown)
      // Block body scroll when open
      document.body.style.overflow = 'hidden'

      return () => {
         window.removeEventListener('keydown', handleKeyDown)
         document.body.style.overflow = ''
      }
   }, [isOpen, nextImage, prevImage])

   return (
      <>
         <div className="group relative mb-10 grid aspect-[21/9] w-full grid-cols-1 gap-2 overflow-hidden rounded-2xl font-sans md:grid-cols-4">
            {/* Main Featured Photo (Left) */}
            <div className="relative h-full w-full bg-zinc-100 md:col-span-2 dark:bg-zinc-900">
               <Image
                  src={photos[0]}
                  alt={`${title} - Main View`}
                  fill
                  onClick={() => openLightbox(0)}
                  className="cursor-pointer object-cover transition-all duration-350 hover:brightness-90"
                  priority
                  sizes="(max-w-768px) 100vw, 50vw"
               />
            </div>
            {/* Quad grid of smaller photos (Right) */}
            <div className="grid h-full grid-cols-2 gap-2 md:col-span-2">
               {photos.slice(1, 5).map((photo, i) => (
                  <div key={i} className="relative h-full w-full bg-zinc-100 dark:bg-zinc-900">
                     <Image
                        src={photo}
                        alt={`${title} - view ${i + 2}`}
                        fill
                        onClick={() => openLightbox(i + 1)}
                        className="cursor-pointer object-cover transition-all duration-350 hover:brightness-90"
                        sizes="(max-w-768px) 50vw, 25vw"
                     />
                  </div>
               ))}
            </div>

            {/* Show all photos button */}
            <button
               onClick={() => openLightbox(0)}
               className="absolute right-4 bottom-4 z-10 flex cursor-pointer items-center gap-2 rounded-md border border-zinc-900 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md transition-colors hover:bg-zinc-50"
            >
               <svg
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 fill-current"
               >
                  <path d="M3 5H1v10h10v-2H3V5zm12-4H5v10h10V1zM6 9l2-3 1.5 2 2.5-3.5L14 9H6z" />
               </svg>
               Show all photos
            </button>
         </div>

         {/* Lightbox Modal (Facebook / Instagram Style) */}
         {isOpen && (
            <div className="animate-in fade-in fixed inset-0 z-[9999] flex flex-col justify-between bg-black/95 p-6 text-white duration-200 select-none">
               {/* Header */}
               <div className="z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
                  <span className="text-sm font-semibold tracking-wider text-zinc-400">
                     {currentIndex + 1} / {photos.length}
                  </span>
                  <button
                     onClick={closeLightbox}
                     className="cursor-pointer rounded-full p-2 transition-colors hover:bg-zinc-800/80 active:scale-95"
                  >
                     <X className="h-6 w-6 text-white" />
                  </button>
               </div>

               {/* Image Showcase Center container */}
               <div className="relative mx-auto flex w-full max-w-7xl flex-grow items-center justify-center px-4 sm:px-12">
                  {/* Prev Button */}
                  <button
                     onClick={prevImage}
                     className="absolute left-0 z-20 cursor-pointer rounded-full border border-zinc-700/50 bg-zinc-900/50 p-3 transition-all hover:bg-zinc-800 active:scale-90 sm:left-4"
                  >
                     <ChevronLeft className="h-6 w-6 text-white" />
                  </button>

                  {/* Center Image */}
                  <div className="relative flex h-[75vh] w-full items-center justify-center">
                     <Image
                        src={photos[currentIndex]}
                        alt={`${title} - Lightbox View`}
                        fill
                        className="pointer-events-none rounded-sm object-contain shadow-2xl transition-all duration-300"
                        sizes="100vw"
                        priority
                     />
                  </div>

                  {/* Next Button */}
                  <button
                     onClick={nextImage}
                     className="absolute right-0 z-20 cursor-pointer rounded-full border border-zinc-700/50 bg-zinc-900/50 p-3 transition-all hover:bg-zinc-800 active:scale-90 sm:right-4"
                  >
                     <ChevronRight className="h-6 w-6 text-white" />
                  </button>
               </div>

               {/* Footer */}
               <div className="z-10 w-full pb-2 text-center text-sm font-medium tracking-tight text-zinc-300">
                  {title}
               </div>
            </div>
         )}
      </>
   )
}
