'use client'

import * as React from 'react'
import { Camera, AlertTriangle, UploadCloud, Loader2, Trash2 } from 'lucide-react'

interface CreateListingPhotosProps {
   photoUrls: string[]
   uploadingPhotos: boolean
   onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
   onRemovePhoto: (index: number) => void
}

export function CreateListingPhotos({
   photoUrls,
   uploadingPhotos,
   onPhotoUpload,
   onRemovePhoto
}: CreateListingPhotosProps) {
   return (
      <section
         id="photos"
         className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
         {/* Section Header */}
         <div className="mb-6 flex items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-[#ff385c] dark:bg-zinc-800">
               <Camera className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-base font-black">Listing Photos</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add photos of your property to show guests what your space is like.
               </p>
            </div>
         </div>

         {/* Cloudinary Warning Indicator */}
         {!(
            process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
         ) && (
            <div className="border-rose-250 dark:border-rose-850 mb-5 flex items-start gap-3 rounded-2xl border bg-rose-50/50 p-4 text-xs dark:bg-rose-950/20">
               <AlertTriangle className="dark:text-rose-450 h-4.5 w-4.5 shrink-0 text-rose-600" />
               <div>
                  <p className="font-extrabold text-rose-800 dark:text-rose-300">
                     Cloudinary Configuration Required
                  </p>
                  <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                     Please configure your Cloudinary keys (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
                     `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) in your `.env` file to upload images.
                  </p>
               </div>
            </div>
         )}

         {/* Dropzone */}
         <div className="space-y-5">
            <div className="group dark:border-zinc-850 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/40 px-4 py-8 text-center transition-all duration-300 hover:border-[#ff385c]/55 hover:bg-zinc-50 dark:bg-zinc-900/30 dark:hover:border-[#ff385c]/55 dark:hover:bg-zinc-800/20">
               <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onPhotoUpload}
                  disabled={uploadingPhotos}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
               />

               <div className="border-zinc-150 text-zinc-550 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-xs transition-all duration-300 group-hover:border-[#ff385c]/30 group-hover:text-[#ff385c] dark:border-zinc-700 dark:bg-zinc-800">
                  {uploadingPhotos ? (
                     <Loader2 className="h-4 w-4 animate-spin text-[#ff385c]" />
                  ) : (
                     <UploadCloud className="h-4 w-4" />
                  )}
               </div>

               <p className="text-zinc-855 mt-3 text-xs font-bold dark:text-zinc-200">
                  {uploadingPhotos
                     ? 'Uploading your images...'
                     : 'Drag and drop or click to upload'}
               </p>
               <p className="text-zinc-450 dark:text-zinc-555 mt-0.5 text-[11px] leading-normal">
                  High resolution JPG, PNG or JPEG files. Drag multiple photos at once.
               </p>
            </div>

            {/* Photos Preview Grid (Smaller & Uniform Cards) */}
            {photoUrls.length > 0 && (
               <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                     <span className="text-zinc-450 text-[10px] font-black tracking-wider uppercase dark:text-zinc-400">
                        Uploaded Photos ({photoUrls.length})
                     </span>
                     <span className="text-zinc-450 text-[10px] dark:text-zinc-500">
                        First image is the cover photo.
                     </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
                     {photoUrls.map((url, index) => {
                        const isCover = index === 0
                        return (
                           <div
                              key={url}
                              className={`group bg-zinc-105 relative aspect-square overflow-hidden rounded-xl border shadow-xs transition-all duration-300 hover:scale-[1.03] ${
                                 isCover
                                    ? 'border-[#ff385c]'
                                    : 'border-zinc-200 dark:border-zinc-800'
                              }`}
                           >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                 src={url}
                                 alt={`Listing photo ${index + 1}`}
                                 className="h-full w-full object-cover"
                              />

                              {/* Hover Dark Overlay */}
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-250 group-hover:opacity-100" />

                              {/* Cover Photo Badge */}
                              {isCover && (
                                 <div className="absolute right-1 bottom-1 left-1 rounded-md bg-[#ff385c] py-0.5 text-center text-[8px] font-black tracking-wider text-white uppercase">
                                    Cover
                                 </div>
                              )}

                              {/* Index Badge (when not cover) */}
                              {!isCover && (
                                 <div className="absolute top-1 left-1 rounded bg-zinc-950/75 px-1 py-0.5 text-[8px] font-extrabold text-white">
                                    {index + 1}
                                 </div>
                              )}

                              {/* Delete Button (visible on hover) */}
                              <button
                                 type="button"
                                 onClick={() => onRemovePhoto(index)}
                                 className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-zinc-950/85 text-zinc-300 shadow-md transition-all hover:bg-white hover:text-red-500"
                                 title="Delete photo"
                              >
                                 <Trash2 className="h-3 w-3" />
                              </button>
                           </div>
                        )
                     })}
                  </div>
               </div>
            )}
         </div>
      </section>
   )
}
