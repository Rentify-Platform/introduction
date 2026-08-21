import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { Property, PropertyRoomType, PropertyStatus } from '../../domain/entities/property.entity'
import { PropertyLicense } from '../../domain/entities/property-license.entity'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { property_status, room_type, kyc_doc_status } from '@prisma/client'

@Injectable()
export class ListingsPrismaRepository implements ListingsRepository {
   constructor(private readonly prisma: PrismaService) {}

   private formatTime(time: Date | string): string {
      if (typeof time === 'string') return time
      const pad = (num: number) => String(num).padStart(2, '0')
      return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}`
   }

   async findById(id: string): Promise<Property | null> {
      const record = await this.prisma.properties.findUnique({
         where: { id },
         include: {
            property_amenities: {
               include: {
                  amenities: true
               }
            },
            property_photos: {
               orderBy: { position: 'asc' }
            }
         }
      })

      if (!record) return null

      const amenities = record.property_amenities.map((a: any) => ({
         id: a.amenity_id,
         name: a.amenities.label
      }))
      const photoUrls = record.property_photos.map((p: any) => p.url)

      return new Property(
         record.id,
         record.host_id,
         record.property_type_id,
         record.room_type,
         record.status,
         record.title,
         record.description,
         record.address_line1,
         record.address_line2,
         record.city,
         record.state_province,
         record.country_code,
         record.postal_code,
         Number(record.latitude),
         Number(record.longitude),
         record.max_guests,
         record.bedrooms,
         record.beds,
         Number(record.bathrooms),
         record.base_price_cents,
         record.cleaning_fee_cents,
         record.currency,
         record.minimum_nights,
         record.maximum_nights,
         this.formatTime(record.check_in_time),
         this.formatTime(record.check_out_time),
         record.instant_book,
         record.cancellation_policy_code,
         record.requires_local_license,
         record.created_at,
         record.updated_at,
         record.published_at,
         record.deleted_at,
         amenities,
         photoUrls
      )
   }

   async save(property: Property): Promise<Property> {
      await this.prisma.$transaction(async (tx) => {
         await tx.properties.upsert({
            where: { id: property.id },
            update: {
               property_type_id: property.propertyTypeId,
               room_type: property.roomType,
               status: property.status,
               title: property.title,
               description: property.description,
               address_line1: property.addressLine1,
               address_line2: property.addressLine2,
               city: property.city,
               state_province: property.stateProvince,
               country_code: property.countryCode,
               postal_code: property.postalCode,
               latitude: property.latitude as any,
               longitude: property.longitude as any,
               max_guests: property.maxGuests,
               bedrooms: property.bedrooms,
               beds: property.beds,
               bathrooms: property.bathrooms as any,
               base_price_cents: property.basePriceCents,
               cleaning_fee_cents: property.cleaningFeeCents,
               currency: property.currency,
               minimum_nights: property.minimumNights,
               maximum_nights: property.maximumNights,
               check_in_time: new Date(`1970-01-01T${property.checkInTime}:00Z`),
               check_out_time: new Date(`1970-01-01T${property.checkOutTime}:00Z`),
               instant_book: property.instantBook,
               cancellation_policy_code: property.cancellationPolicyCode,
               requires_local_license: property.requiresLocalLicense,
               published_at: property.publishedAt,
               deleted_at: property.deletedAt,
               updated_at: property.updatedAt
            },
            create: {
               id: property.id,
               host_id: property.hostId,
               property_type_id: property.propertyTypeId,
               room_type: property.roomType,
               status: property.status,
               title: property.title,
               description: property.description,
               address_line1: property.addressLine1,
               address_line2: property.addressLine2,
               city: property.city,
               state_province: property.stateProvince,
               country_code: property.countryCode,
               postal_code: property.postalCode,
               latitude: property.latitude as any,
               longitude: property.longitude as any,
               max_guests: property.maxGuests,
               bedrooms: property.bedrooms,
               beds: property.beds,
               bathrooms: property.bathrooms as any,
               base_price_cents: property.basePriceCents,
               cleaning_fee_cents: property.cleaningFeeCents,
               currency: property.currency,
               minimum_nights: property.minimumNights,
               maximum_nights: property.maximumNights,
               check_in_time: new Date(`1970-01-01T${property.checkInTime}:00Z`),
               check_out_time: new Date(`1970-01-01T${property.checkOutTime}:00Z`),
               instant_book: property.instantBook,
               cancellation_policy_code: property.cancellationPolicyCode,
               requires_local_license: property.requiresLocalLicense,
               created_at: property.createdAt,
               updated_at: property.updatedAt,
               published_at: property.publishedAt,
               deleted_at: property.deletedAt
            }
         })

         await tx.outbox_events.create({
            data: {
               aggregate_type: 'property',
               aggregate_id: property.id,
               event_type: 'property.status.changed',
               payload: { status: property.status },
               status: 'pending'
            }
         })
      })

      return property
   }

   async saveLicense(license: PropertyLicense): Promise<PropertyLicense> {
      await this.prisma.property_licenses.upsert({
         where: { id: license.id },
         update: {
            license_number: license.licenseNumber,
            issuing_authority: license.issuingAuthority,
            file_url: license.fileUrl,
            expiry_date: license.expiryDate,
            status: license.status,
            verified_at: license.verifiedAt
         },
         create: {
            id: license.id,
            property_id: license.propertyId,
            license_number: license.licenseNumber,
            issuing_authority: license.issuingAuthority,
            file_url: license.fileUrl,
            expiry_date: license.expiryDate,
            status: license.status,
            verified_at: license.verifiedAt,
            created_at: license.createdAt
         }
      })

      return license
   }

   async findVerifiedLicenseByPropertyId(propertyId: string): Promise<PropertyLicense | null> {
      const record = await this.prisma.property_licenses.findFirst({
         where: {
            property_id: propertyId,
            status: 'verified'
         },
         orderBy: { created_at: 'desc' }
      })

      if (!record) return null

      return new PropertyLicense(
         record.id,
         record.property_id,
         record.license_number,
         record.issuing_authority,
         record.file_url,
         record.expiry_date,
         record.status,
         record.verified_at,
         record.created_at
      )
   }

   async checkHostKycVerified(hostId: string): Promise<boolean> {
      const hostProfile = await this.prisma.host_profiles.findUnique({
         where: { account_id: hostId }
      })
      return hostProfile?.kyc_status === 'verified'
   }

   async populateCalendar(
      propertyId: string,
      basePriceCents: bigint,
      minimumNights: number,
      days: number
   ): Promise<void> {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const calendarEntries: any[] = []
      for (let i = 0; i < days; i++) {
         const date = new Date(today)
         date.setUTCDate(today.getUTCDate() + i)

         calendarEntries.push({
            property_id: propertyId,
            date: date,
            is_available: true,
            price_cents: basePriceCents,
            min_stay: minimumNights
         })
      }

      await this.prisma.property_calendar.createMany({
         data: calendarEntries,
         skipDuplicates: true
      })
   }

   async findPropertyTypeById(id: number): Promise<boolean> {
      const type = await this.prisma.property_types.findUnique({
         where: { id }
      })
      return !!type
   }

   async saveAmenities(propertyId: string, amenityIds: number[]): Promise<void> {
      await this.prisma.property_amenities.deleteMany({
         where: { property_id: propertyId }
      })

      const data = amenityIds.map((id) => ({
         property_id: propertyId,
         amenity_id: id
      }))

      await this.prisma.property_amenities.createMany({
         data
      })
   }

   async savePhotos(propertyId: string, photoUrls: string[]): Promise<void> {
      await this.prisma.property_photos.deleteMany({
         where: { property_id: propertyId }
      })

      const data = photoUrls.map((url, index) => ({
         property_id: propertyId,
         url,
         position: index
      }))

      await this.prisma.property_photos.createMany({
         data
      })
   }

   async findManyByHostId(hostId: string): Promise<Property[]> {
      const records = await this.prisma.properties.findMany({
         where: { host_id: hostId },
         include: {
            property_amenities: {
               include: {
                  amenities: true
               }
            },
            property_photos: {
               orderBy: { position: 'asc' }
            }
         },
         orderBy: { created_at: 'desc' }
      })

      return records.map((record) => {
         const amenities = record.property_amenities.map((a: any) => ({
            id: a.amenity_id,
            name: a.amenities.label
         }))
         const photoUrls = record.property_photos.map((p: any) => p.url)

         return new Property(
            record.id,
            record.host_id,
            record.property_type_id,
            record.room_type,
            record.status,
            record.title,
            record.description,
            record.address_line1,
            record.address_line2,
            record.city,
            record.state_province,
            record.country_code,
            record.postal_code,
            Number(record.latitude),
            Number(record.longitude),
            record.max_guests,
            record.bedrooms,
            record.beds,
            Number(record.bathrooms),
            record.base_price_cents,
            record.cleaning_fee_cents,
            record.currency,
            record.minimum_nights,
            record.maximum_nights,
            this.formatTime(record.check_in_time),
            this.formatTime(record.check_out_time),
            record.instant_book,
            record.cancellation_policy_code,
            record.requires_local_license,
            record.created_at,
            record.updated_at,
            record.published_at,
            record.deleted_at,
            amenities,
            photoUrls
         )
      })
   }

   async findLicenseByPropertyId(propertyId: string): Promise<PropertyLicense | null> {
      // 1. Fetch the most recent license for the property regardless of status
      const record = await this.prisma.property_licenses.findFirst({
         where: { property_id: propertyId },
         orderBy: { created_at: 'desc' }
      })

      if (!record) return null

      return new PropertyLicense(
         record.id,
         record.property_id,
         record.license_number,
         record.issuing_authority,
         record.file_url,
         record.expiry_date,
         record.status,
         record.verified_at,
         record.created_at
      )
   }

   async findAllAdmin(
      filter: import('../../domain/repositories/listings.repository').FindAllPropertiesFilter
   ): Promise<import('../../domain/repositories/listings.repository').PaginatedProperties> {
      const page = filter.page ?? 1
      const limit = filter.limit ?? 20
      const skip = (page - 1) * limit

      // 1. Build dynamic where clause
      const where: Record<string, unknown> = {}

      if (filter.status) {
         where['status'] = filter.status
      }

      if (filter.hostId) {
         where['host_id'] = filter.hostId
      }

      if (filter.search) {
         const term = filter.search.trim()
         where['OR'] = [
            { title: { contains: term, mode: 'insensitive' } },
            { city: { contains: term, mode: 'insensitive' } },
            { country_code: { contains: term, mode: 'insensitive' } }
         ]
      }

      // 2. Run count and data in parallel
      const [total, records] = await this.prisma.$transaction([
         this.prisma.properties.count({ where: where as any }),
         this.prisma.properties.findMany({
            where: where as any,
            include: {
               property_amenities: { include: { amenities: true } },
               property_photos: { orderBy: { position: 'asc' } }
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit
         })
      ])

      // 3. Map records to domain entities
      const data = records.map((record: any) => {
         const amenities = record.property_amenities.map((a: any) => ({
            id: a.amenity_id,
            name: a.amenities.label
         }))
         const photoUrls = record.property_photos.map((p: any) => p.url)

         return new Property(
            record.id,
            record.host_id,
            record.property_type_id,
            record.room_type as PropertyRoomType,
            record.status as PropertyStatus,
            record.title,
            record.description,
            record.address_line1,
            record.address_line2,
            record.city,
            record.state_province,
            record.country_code,
            record.postal_code,
            Number(record.latitude),
            Number(record.longitude),
            record.max_guests,
            record.bedrooms,
            record.beds,
            Number(record.bathrooms),
            record.base_price_cents,
            record.cleaning_fee_cents,
            record.currency,
            record.minimum_nights,
            record.maximum_nights,
            this.formatTime(record.check_in_time),
            this.formatTime(record.check_out_time),
            record.instant_book,
            record.cancellation_policy_code,
            record.requires_local_license,
            record.created_at,
            record.updated_at,
            record.published_at,
            record.deleted_at,
            amenities,
            photoUrls
         )
      })

      return { data, total, page, limit }
   }

   async updatePropertyStatus(
      id: string,
      status: 'active' | 'paused' | 'archived'
   ): Promise<Property> {
      // 1. Update status (set deleted_at for archived, clear for others)
      const record = await this.prisma.properties.update({
         where: { id },
         data: {
            status: status,
            updated_at: new Date(),
            deleted_at: status === 'archived' ? new Date() : null
         },
         include: {
            property_amenities: { include: { amenities: true } },
            property_photos: { orderBy: { position: 'asc' } }
         }
      })

      const amenities = (record as any).property_amenities.map((a: any) => ({
         id: a.amenity_id,
         name: a.amenities.label
      }))
      const photoUrls = (record as any).property_photos.map((p: any) => p.url)

      return new Property(
         record.id,
         record.host_id,
         record.property_type_id,
         record.room_type,
         record.status,
         record.title,
         record.description,
         record.address_line1,
         record.address_line2,
         record.city,
         record.state_province,
         record.country_code,
         record.postal_code,
         Number(record.latitude),
         Number(record.longitude),
         record.max_guests,
         record.bedrooms,
         record.beds,
         Number(record.bathrooms),
         record.base_price_cents,
         record.cleaning_fee_cents,
         record.currency,
         record.minimum_nights,
         record.maximum_nights,
         this.formatTime(record.check_in_time),
         this.formatTime(record.check_out_time),
         record.instant_book,
         record.cancellation_policy_code,
         record.requires_local_license,
         record.created_at,
         record.updated_at,
         record.published_at,
         record.deleted_at,
         amenities,
         photoUrls
      )
   }
}
