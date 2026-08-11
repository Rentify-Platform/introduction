import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { MeilisearchService } from '../../../../shared/meilisearch/meilisearch.service'
import { Property } from '../../../listings/domain/entities/property.entity'
import {
   SearchRepository,
   SearchParams,
   SearchResult,
   ListingDetail,
   ReviewDetail
} from '../../domain/repositories/search.repository'

@Injectable()
export class SearchPrismaRepository implements SearchRepository {
   constructor(
      private readonly prisma: PrismaService,
      private readonly meiliService: MeilisearchService
   ) {}

   private formatTime(time: Date | string): string {
      if (typeof time === 'string') return time
      const pad = (num: number) => String(num).padStart(2, '0')
      return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}`
   }

   private mapToPropertyEntity(record: any): Property {
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

   private async getUnavailablePropertyIds(checkIn: Date, checkOut: Date): Promise<string[]> {
      // 1. Get blocked dates from calendar
      const blockedCalendar = await this.prisma.property_calendar.findMany({
         where: {
            date: {
               gte: checkIn,
               lt: checkOut
            },
            is_available: false
         },
         select: { property_id: true }
      })

      // 2. Get overlapping bookings (pending/confirmed statuses)
      const overlappingBookings = await this.prisma.bookings.findMany({
         where: {
            status: { in: ['pending', 'confirmed'] },
            check_in: { lt: checkOut },
            check_out: { gt: checkIn }
         },
         select: { property_id: true }
      })

      const ids = new Set<string>([
         ...blockedCalendar.map((c) => c.property_id),
         ...overlappingBookings.map((b) => b.property_id)
      ])

      return Array.from(ids)
   }

   async search(params: SearchParams): Promise<SearchResult> {
      try {
         const index = this.meiliService.getPropertiesIndex()
         const filters: string[] = ['status = active']

         if (params.city) {
            filters.push(`city = "${params.city}"`)
         }
         if (params.roomType) {
            filters.push(`room_type = "${params.roomType}"`)
         }
         if (params.propertyType) {
            filters.push(`property_type = "${params.propertyType}"`)
         }
         if (params.guests) {
            filters.push(`max_guests >= ${params.guests}`)
         }
         if (params.minPrice !== undefined) {
            filters.push(`price_cents >= ${params.minPrice}`)
         }
         if (params.maxPrice !== undefined) {
            filters.push(`price_cents <= ${params.maxPrice}`)
         }
         if (params.amenities && params.amenities.length > 0) {
            params.amenities.forEach((amenity) => {
               filters.push(`amenities = "${amenity}"`)
            })
         }
         if (params.latitude !== undefined && params.longitude !== undefined) {
            const radiusM = (params.radiusKm || 10) * 1000
            filters.push(`_geoRadius(${params.latitude}, ${params.longitude}, ${radiusM})`)
         }

         if (params.checkIn && params.checkOut) {
            const unavailableIds = await this.getUnavailablePropertyIds(
               params.checkIn,
               params.checkOut
            )
            if (unavailableIds.length > 0) {
               const idsString = unavailableIds.map((id) => `"${id}"`).join(', ')
               filters.push(`NOT id IN [${idsString}]`)
            }
         }

         let sort: string[] = []
         if (params.sortBy === 'price_asc') {
            sort = ['price_cents:asc']
         } else if (params.sortBy === 'price_desc') {
            sort = ['price_cents:desc']
         } else if (params.sortBy === 'newest') {
            sort = ['created_at:desc']
         }

         const offset = (params.page - 1) * params.limit

         const searchRes = await index.search(params.query || '', {
            filter: filters.join(' AND '),
            sort,
            offset,
            limit: params.limit
         })

         const total = searchRes.estimatedTotalHits || searchRes.hits.length
         const matchedIds = searchRes.hits.map((hit) => hit.id)

         if (matchedIds.length === 0) {
            return { items: [], total: 0 }
         }

         // Hydrate matching property records from database to ensure correctness and relations
         const records = await this.prisma.properties.findMany({
            where: {
               id: { in: matchedIds }
            },
            include: {
               property_amenities: { include: { amenities: true } },
               property_photos: { orderBy: { position: 'asc' } }
            }
         })

         // Sort hydrated records according to Meilisearch search hits order
         const recordMap = new Map(records.map((r) => [r.id, r]))
         const items = matchedIds
            .map((id) => recordMap.get(id))
            .filter((r): r is Exclude<typeof r, undefined> => !!r)
            .map((record) => this.mapToPropertyEntity(record))

         return { items, total }
      } catch (error) {
         console.warn(
            '[SearchRepository] Meilisearch search failed, falling back to database query:',
            error.message
         )
         return this.searchFallback(params)
      }
   }

   async searchFallback(params: SearchParams): Promise<SearchResult> {
      const whereClause: any = {
         status: 'active',
         deleted_at: null
      }

      if (params.city) {
         whereClause.city = {
            contains: params.city,
            mode: 'insensitive'
         }
      }

      if (params.roomType) {
         whereClause.room_type = params.roomType as any
      }

      if (params.propertyType) {
         whereClause.property_types = {
            label: {
               equals: params.propertyType,
               mode: 'insensitive'
            }
         }
      }

      if (params.guests) {
         whereClause.max_guests = {
            gte: params.guests
         }
      }

      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
         whereClause.base_price_cents = {}
         if (params.minPrice !== undefined) {
            whereClause.base_price_cents.gte = BigInt(params.minPrice)
         }
         if (params.maxPrice !== undefined) {
            whereClause.base_price_cents.lte = BigInt(params.maxPrice)
         }
      }

      // Fallback availability check in DB
      if (params.checkIn && params.checkOut) {
         const unavailableIds = await this.getUnavailablePropertyIds(
            params.checkIn,
            params.checkOut
         )
         if (unavailableIds.length > 0) {
            whereClause.id = {
               notIn: unavailableIds
            }
         }
      }

      // If text query is provided in fallback (simple search on title/description/city/address)
      if (params.query) {
         whereClause.OR = [
            { title: { contains: params.query, mode: 'insensitive' } },
            { description: { contains: params.query, mode: 'insensitive' } },
            { city: { contains: params.query, mode: 'insensitive' } },
            { address_line1: { contains: params.query, mode: 'insensitive' } }
         ]
      }

      // Sort mapping
      let orderBy: any = { created_at: 'desc' }
      if (params.sortBy === 'price_asc') {
         orderBy = { base_price_cents: 'asc' }
      } else if (params.sortBy === 'price_desc') {
         orderBy = { base_price_cents: 'desc' }
      } else if (params.sortBy === 'newest') {
         orderBy = { created_at: 'desc' }
      }

      const allProperties = await this.prisma.properties.findMany({
         where: whereClause,
         include: {
            property_amenities: { include: { amenities: true } },
            property_photos: { orderBy: { position: 'asc' } }
         },
         orderBy
      })

      let filteredProperties = allProperties

      // Bounding-box or Haversine distance filtering on coords in JS fallback
      if (params.latitude !== undefined && params.longitude !== undefined) {
         const radiusKm = params.radiusKm || 10
         const lat1 = params.latitude
         const lon1 = params.longitude
         filteredProperties = allProperties.filter((p) => {
            const lat2 = Number(p.latitude)
            const lon2 = Number(p.longitude)
            const dist = this.calculateDistance(lat1, lon1, lat2, lon2)
            return dist <= radiusKm
         })
      }

      // Filter by amenities in fallback if provided
      if (params.amenities && params.amenities.length > 0) {
         filteredProperties = filteredProperties.filter((p) => {
            const propertyAmenityNames = p.property_amenities.map((pa) =>
               pa.amenities.label.toLowerCase()
            )
            return params.amenities!.every((a) => propertyAmenityNames.includes(a.toLowerCase()))
         })
      }

      // Paginate
      const total = filteredProperties.length
      const offset = (params.page - 1) * params.limit
      const paginatedItems = filteredProperties.slice(offset, offset + params.limit)

      const items = paginatedItems.map((record) => this.mapToPropertyEntity(record))

      return { items, total }
   }

   private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371 // Radius of earth in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
         Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
   }

   async findListingDetail(id: string): Promise<ListingDetail | null> {
      const record = await this.prisma.properties.findUnique({
         where: { id },
         include: {
            property_amenities: { include: { amenities: true } },
            property_photos: { orderBy: { position: 'asc' } }
         }
      })

      if (!record || record.deleted_at !== null || record.status !== 'active') {
         return null
      }

      const property = this.mapToPropertyEntity(record)

      // Fetch reviews target at this property stay (guest_to_host reviews)
      const reviewsData = await this.prisma.reviews.findMany({
         where: {
            bookings: {
               property_id: id
            },
            type: 'guest_to_host'
         },
         include: {
            accounts_reviews_author_idToaccounts: {
               include: {
                  profiles: true
               }
            }
         },
         orderBy: {
            created_at: 'desc'
         }
      })

      const reviews: ReviewDetail[] = reviewsData.map((r) => {
         const profile = r.accounts_reviews_author_idToaccounts.profiles
         const authorName = profile
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : 'Anonymous Guest'
         const authorAvatarUrl = profile?.avatar_url || null

         return {
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at,
            authorName,
            authorAvatarUrl,
            hostResponse: r.host_response
         }
      })

      const totalReviews = reviews.length
      const averageRating =
         totalReviews > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2))
            : 0

      return {
         property,
         reviews,
         averageRating,
         totalReviews
      }
   }
}
