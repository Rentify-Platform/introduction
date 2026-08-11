'use client'

import * as React from 'react'
import toast from 'react-hot-toast'

interface UseUploadReturn {
   isUploading: boolean
   error: string | null
   uploadFile: (file: File) => Promise<string>
   uploadMultiple: (files: File[] | FileList) => Promise<string[]>
}

export function useUpload(): UseUploadReturn {
   const [isUploading, setIsUploading] = React.useState(false)
   const [error, setError] = React.useState<string | null>(null)

   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
   const isCloudinaryConfigured = !!(cloudName && uploadPreset)

   const uploadFile = React.useCallback(
      async (file: File): Promise<string> => {
         setIsUploading(true)
         setError(null)

         try {
            if (!isCloudinaryConfigured || !cloudName || !uploadPreset) {
               throw new Error(
                  'Cloudinary configuration is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.'
               )
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', uploadPreset)

            const response = await fetch(
               `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
               {
                  method: 'POST',
                  body: formData
               }
            )

            if (!response.ok) {
               throw new Error(`Upload failed for ${file.name}`)
            }

            const data = await response.json()
            return data.secure_url as string
         } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : `Failed to upload ${file.name}`
            setError(msg)
            throw new Error(msg)
         } finally {
            setIsUploading(false)
         }
      },
      [isCloudinaryConfigured, cloudName, uploadPreset]
   )

   const uploadMultiple = React.useCallback(
      async (files: File[] | FileList): Promise<string[]> => {
         setIsUploading(true)
         setError(null)

         const filesArray = Array.isArray(files) ? files : Array.from(files)
         const uploadedUrls: string[] = []
         let hasErrors = false

         for (const file of filesArray) {
            try {
               const url = await uploadFile(file)
               uploadedUrls.push(url)
            } catch (err: unknown) {
               hasErrors = true
               console.error('Upload error for file:', file.name, err)
               const msg = err instanceof Error ? err.message : `Failed to upload ${file.name}`
               toast.error(msg)
            }
         }

         if (hasErrors && uploadedUrls.length === 0) {
            setError('All file uploads failed')
         }

         setIsUploading(false)
         return uploadedUrls
      },
      [uploadFile]
   )

   return {
      isUploading,
      error,
      uploadFile,
      uploadMultiple
   }
}
