'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { Button } from '@/components/ui/button'
import { useListingDetail, useUpdateListing } from '@/features/listings/hooks/use-listings-queries'
import toast from 'react-hot-toast'
import { useUpload } from '@/hooks/use-upload'

// Import Decomposed Subcomponents from features/hosting
import { CreateListingSidebar } from '@/features/hosting/components/create-listing-sidebar'
import { CreateListingBasicInfo } from '@/features/hosting/components/create-listing-basic-info'
import { CreateListingLocation } from '@/features/hosting/components/create-listing-location'
import { CreateListingCapacity } from '@/features/hosting/components/create-listing-capacity'
import { CreateListingAmenities } from '@/features/hosting/components/create-listing-amenities'
import { CreateListingPhotos } from '@/features/hosting/components/create-listing-photos'
import { CreateListingPricing } from '@/features/hosting/components/create-listing-pricing'
import { EditListingFooter } from '@/features/hosting/components/edit-listing-footer'

// Form Sections ID
const SECTIONS = ['basic-info', 'location', 'capacity', 'amenities', 'photos', 'pricing']

export default function EditListingPage() {
   const params = useParams()
   const id = params.id as string
   const router = useRouter()

   const { isAuthenticated, user, isInitialized } = useAuthStore()
   const { data: listingDetail, isLoading, isError } = useListingDetail(id)
   const updateMutation = useUpdateListing()

   // Active Sidebar Section Scroll Spy State
   const [activeSection, setActiveSection] = React.useState('basic-info')

   // Form states
   const [title, setTitle] = React.useState('')
   const [description, setDescription] = React.useState('')
   const [propertyTypeId, setPropertyTypeId] = React.useState<number>(1)
   const [roomType, setRoomType] = React.useState('entire_place')

   const [addressLine1, setAddressLine1] = React.useState('')
   const [addressLine2, setAddressLine2] = React.useState('')
   const [city, setCity] = React.useState('')
   const [stateProvince, setStateProvince] = React.useState('')
   const [countryCode, setCountryCode] = React.useState('US')
   const [postalCode, setPostalCode] = React.useState('')
   const [latitude, setLatitude] = React.useState<number>(37.7749)
   const [longitude, setLongitude] = React.useState<number>(-122.4194)

   const [maxGuests, setMaxGuests] = React.useState(2)
   const [bedrooms, setBedrooms] = React.useState(1)
   const [beds, setBeds] = React.useState(1)
   const [bathrooms, setBathrooms] = React.useState(1)

   const [basePrice, setBasePrice] = React.useState<string>('100')
   const [cleaningFee, setCleaningFee] = React.useState<string>('25')
   const [minimumNights, setMinimumNights] = React.useState(1)
   const [maximumNights, setMaximumNights] = React.useState(365)
   const [checkInTime, setCheckInTime] = React.useState('15:00')
   const [checkOutTime, setCheckOutTime] = React.useState('11:00')
   const [instantBook, setInstantBook] = React.useState(false)

   const [amenityIds, setAmenityIds] = React.useState<number[]>([])
   const [photoUrls, setPhotoUrls] = React.useState<string[]>([])

   const { uploadMultiple, isUploading: uploadingPhotos } = useUpload()

   // Protect page routing
   React.useEffect(() => {
      if (isInitialized) {
         if (!isAuthenticated) {
            toast.error('Please log in to edit listings.')
            router.push(`/login?redirect=/hosting/${id}/edit`)
         } else if (user?.role !== 'host') {
            toast.error('Please complete host onboarding first.')
            router.push('/host')
         }
      }
   }, [isInitialized, isAuthenticated, user, router, id])

   // Populate form states once listingDetail is fetched
   React.useEffect(() => {
      if (listingDetail?.property) {
         const p = listingDetail.property
         setTitle(p.title)
         setDescription(p.description || '')
         setPropertyTypeId(p.propertyTypeId)
         setRoomType(p.roomType)
         setAddressLine1(p.addressLine1)
         setAddressLine2(p.addressLine2 || '')
         setCity(p.city)
         setStateProvince(p.stateProvince || '')
         setCountryCode(p.countryCode)
         setPostalCode(p.postalCode || '')
         setLatitude(p.latitude)
         setLongitude(p.longitude)
         setMaxGuests(p.maxGuests)
         setBedrooms(p.bedrooms)
         setBeds(p.beds)
         setBathrooms(p.bathrooms)
         setBasePrice(String(Number(p.basePriceCents) / 100))
         setCleaningFee(String(Number(p.cleaningFeeCents) / 100))
         setMinimumNights(p.minimumNights)
         setMaximumNights(p.maximumNights)
         setCheckInTime(p.checkInTime)
         setCheckOutTime(p.checkOutTime)
         setInstantBook(p.instantBook)
         setAmenityIds(p.amenities.map((a) => a.id))
         setPhotoUrls(p.photoUrls || [])
      }
   }, [listingDetail])

   // Scroll spy logic
   React.useEffect(() => {
      const handleScroll = () => {
         const scrollPosition = window.scrollY + 200

         for (const sectionId of SECTIONS) {
            const el = document.getElementById(sectionId)
            if (el) {
               const top = el.offsetTop
               const height = el.offsetHeight
               if (scrollPosition >= top && scrollPosition < top + height) {
                  setActiveSection(sectionId)
                  break
               }
            }
         }
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
   }, [])

   const handleSectionClick = (idStr: string) => {
      const el = document.getElementById(idStr)
      if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'start' })
         setActiveSection(idStr)
      }
   }

   const handleAmenityToggle = (amenityId: number) => {
      setAmenityIds((prev) =>
         prev.includes(amenityId) ? prev.filter((item) => item !== amenityId) : [...prev, amenityId]
      )
   }

   // File upload handler
   const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const urls = await uploadMultiple(files)
      if (urls.length > 0) {
         setPhotoUrls((prev) => [...prev, ...urls])
      }

      e.target.value = ''
   }

   const handleRemovePhoto = (index: number) => {
      setPhotoUrls((prev) => prev.filter((_, i) => i !== index))
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!title.trim()) return toast.error('Please enter a listing title.')
      if (!addressLine1.trim()) return toast.error('Please enter address line 1.')
      if (!city.trim()) return toast.error('Please enter city.')
      if (!countryCode.trim()) return toast.error('Please enter country code.')
      if (photoUrls.length === 0) return toast.error('Please upload at least one listing photo.')

      const basePriceCents = String(Math.round(Number(basePrice) * 100))
      const cleaningFeeCents = String(Math.round(Number(cleaningFee) * 100))

      const payload = {
         propertyTypeId,
         roomType,
         title,
         description: description || null,
         addressLine1,
         addressLine2: addressLine2 || null,
         city,
         stateProvince: stateProvince || null,
         countryCode,
         postalCode: postalCode || null,
         latitude,
         longitude,
         maxGuests,
         bedrooms,
         beds,
         bathrooms,
         basePriceCents,
         cleaningFeeCents,
         currency: listingDetail?.property.currency || 'VND',
         minimumNights,
         maximumNights,
         checkInTime,
         checkOutTime,
         instantBook,
         amenityIds,
         photoUrls
      }

      try {
         await updateMutation.mutateAsync({ id, data: payload })
         toast.success('Listing updated successfully!')
         router.push('/hosting')
      } catch (err: unknown) {
         const msg = err instanceof Error ? err.message : 'Failed to update listing.'
         toast.error(msg)
      }
   }

   if (isLoading || !isInitialized) {
      return (
         <div className="flex min-h-[70vh] flex-col items-center justify-center font-sans">
            <Loader2 className="h-10 w-10 animate-spin text-[#ff385c]" />
            <p className="mt-4 text-sm text-zinc-500">Loading listing details...</p>
         </div>
      )
   }

   if (isError || !listingDetail?.property) {
      return (
         <div className="flex min-h-[70vh] flex-col items-center justify-center font-sans">
            <p className="text-red-550 text-sm font-semibold">Failed to load property listing.</p>
            <Link href="/hosting" className="mt-4">
               <Button className="bg-zinc-900 text-xs text-white">Back to Hosting</Button>
            </Link>
         </div>
      )
   }

   return (
      <div className="min-h-screen bg-zinc-50 pb-24 font-sans text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
         {/* Top Header Navbar */}
         <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
               <div className="flex items-center gap-4">
                  <Link href="/hosting">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800"
                     >
                        <ArrowLeft className="h-5 w-5" />
                     </Button>
                  </Link>
                  <div>
                     <h1 className="text-xl font-black tracking-tight">Edit property listing</h1>
                     <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Update and save details of: {listingDetail.property.title}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Layout Body */}
         <div className="mx-auto mt-8 flex max-w-7xl gap-8 px-6">
            {/* Left Shopee-Style Sidebar */}
            <div className="hidden w-68 shrink-0 md:block">
               <CreateListingSidebar
                  activeSection={activeSection}
                  onSectionClick={handleSectionClick}
               />
            </div>

            {/* Right Content Form Blocks */}
            <div className="flex-1 space-y-8">
               <CreateListingBasicInfo
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  propertyTypeId={propertyTypeId}
                  setPropertyTypeId={setPropertyTypeId}
                  roomType={roomType}
                  setRoomType={setRoomType}
               />

               <CreateListingLocation
                  addressLine1={addressLine1}
                  setAddressLine1={setAddressLine1}
                  addressLine2={addressLine2}
                  setAddressLine2={setAddressLine2}
                  city={city}
                  setCity={setCity}
                  stateProvince={stateProvince}
                  setStateProvince={setStateProvince}
                  countryCode={countryCode}
                  setCountryCode={setCountryCode}
                  postalCode={postalCode}
                  setPostalCode={setPostalCode}
                  latitude={latitude}
                  setLatitude={setLatitude}
                  longitude={longitude}
                  setLongitude={setLongitude}
               />

               <CreateListingCapacity
                  maxGuests={maxGuests}
                  setMaxGuests={setMaxGuests}
                  bedrooms={bedrooms}
                  setBedrooms={setBedrooms}
                  beds={beds}
                  setBeds={setBeds}
                  bathrooms={bathrooms}
                  setBathrooms={setBathrooms}
               />

               <CreateListingAmenities
                  amenityIds={amenityIds}
                  onAmenityToggle={handleAmenityToggle}
               />

               <CreateListingPhotos
                  photoUrls={photoUrls}
                  uploadingPhotos={uploadingPhotos}
                  onPhotoUpload={handlePhotoUpload}
                  onRemovePhoto={handleRemovePhoto}
               />

               <CreateListingPricing
                  basePrice={basePrice}
                  setBasePrice={setBasePrice}
                  cleaningFee={cleaningFee}
                  setCleaningFee={setCleaningFee}
                  minimumNights={minimumNights}
                  setMinimumNights={setMinimumNights}
                  maximumNights={maximumNights}
                  setMaximumNights={setMaximumNights}
                  checkInTime={checkInTime}
                  setCheckInTime={setCheckInTime}
                  checkOutTime={checkOutTime}
                  setCheckOutTime={setCheckOutTime}
                  instantBook={instantBook}
                  setInstantBook={setInstantBook}
               />
            </div>
         </div>

         {/* Fixed Bottom Action Bar */}
         <EditListingFooter
            isPending={updateMutation.isPending}
            uploadingPhotos={uploadingPhotos}
            photoCount={photoUrls.length}
            onSubmit={handleSubmit}
         />
      </div>
   )
}
