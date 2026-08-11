import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { MeilisearchService } from './meilisearch.service'

@Injectable()
export class OutboxProcessor {
   private readonly logger = new Logger(OutboxProcessor.name)
   private isProcessing = false

   constructor(
      private readonly prisma: PrismaService,
      private readonly meiliService: MeilisearchService
   ) {}

   @Interval(3000)
   async processOutboxEvents() {
      if (this.isProcessing) return
      this.isProcessing = true

      try {
         const events = await this.prisma.outbox_events.findMany({
            where: {
               status: { in: ['pending', 'failed'] },
               attempts: { lt: 5 }
            },
            orderBy: { created_at: 'asc' },
            take: 20
         })

         if (events.length === 0) {
            this.isProcessing = false
            return
         }

         this.logger.log(`Found ${events.length} pending events to sync to Meilisearch...`)

         for (const event of events) {
            await this.prisma.outbox_events.update({
               where: { id: event.id },
               data: {
                  status: 'processing',
                  attempts: { increment: 1 }
               }
            })

            try {
               await this.syncToMeilisearch(event.aggregate_id, event.payload)

               await this.prisma.outbox_events.update({
                  where: { id: event.id },
                  data: { status: 'completed', error_message: null }
               })
            } catch (err) {
               this.logger.error(`Failed to sync event ${event.id}: ${err.message}`)

               await this.prisma.outbox_events.update({
                  where: { id: event.id },
                  data: {
                     status: 'failed',
                     error_message: err.stack || err.message
                  }
               })
            }
         }
      } catch (error) {
         this.logger.error('Error querying outbox events', error)
      } finally {
         this.isProcessing = false
      }
   }

   private async syncToMeilisearch(propertyId: string, payload: any) {
      const index = this.meiliService.getPropertiesIndex()
      const status =
         payload && typeof payload === 'object' && 'status' in payload ? payload.status : null

      if (status === 'active') {
         const property = await this.prisma.properties.findUnique({
            where: { id: propertyId },
            include: {
               property_photos: { orderBy: { position: 'asc' } },
               property_amenities: { include: { amenities: true } },
               property_types: true,
               accounts: {
                  select: {
                     id: true,
                     profiles: { select: { first_name: true, last_name: true, avatar_url: true } }
                  }
               }
            }
         })

         if (!property || property.deleted_at !== null) {
            await index.deleteDocument(propertyId)
            return
         }

         const meiliDocument = {
            id: property.id,
            title: property.title,
            description: property.description,
            status: property.status,
            room_type: property.room_type,
            property_type: property.property_types.label,
            city: property.city,
            address: `${property.address_line1}, ${property.city}`,
            price_cents: Number(property.base_price_cents),
            max_guests: property.max_guests,
            bedrooms: property.bedrooms,
            beds: property.beds,
            bathrooms: Number(property.bathrooms),
            amenities: property.property_amenities.map((pa) => pa.amenities.label),
            photos: property.property_photos.map((p) => p.url),
            host: {
               id: property.accounts.id,
               name: `${property.accounts.profiles?.first_name || ''} ${property.accounts.profiles?.last_name || ''}`.trim(),
               avatar: property.accounts.profiles?.avatar_url
            },
            _geo: {
               lat: Number(property.latitude),
               lng: Number(property.longitude)
            },
            created_at: property.created_at.getTime()
         }

         await index.addDocuments([meiliDocument])
         this.logger.log(`Property ${propertyId} synced to Meilisearch successfully.`)
      } else {
         await index.deleteDocument(propertyId)
         this.logger.log(`Property ${propertyId} removed from Meilisearch index.`)
      }
   }
}
