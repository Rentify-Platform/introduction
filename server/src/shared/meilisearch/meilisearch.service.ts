import { Injectable, OnModuleInit } from '@nestjs/common'
import { Meilisearch, Index } from 'meilisearch'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class MeilisearchService implements OnModuleInit {
   private client: Meilisearch

   constructor(private readonly prisma: PrismaService) {}

   onModuleInit() {
      this.client = new Meilisearch({
         host: 'http://localhost:7700',
         apiKey: 'rentify_master_key_123456'
      })

      this.setupIndexSettings().catch((err) => {
         console.error('[Meilisearch] Failed to setup index settings:', err)
      })
   }

   getPropertiesIndex(): Index {
      return this.client.index('properties')
   }

   async syncAllProperties(): Promise<number> {
      const index = this.getPropertiesIndex()

      // 1. Clear all existing documents from index
      await index.deleteAllDocuments()

      // 2. Fetch all active, non-deleted properties
      const activeProperties = await this.prisma.properties.findMany({
         where: {
            status: 'active',
            deleted_at: null
         },
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

      if (activeProperties.length === 0) {
         return 0
      }

      // 3. Map to Meilisearch flat document schema
      const meiliDocuments = activeProperties.map((property) => ({
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
      }))

      // 4. Batch index documents
      await index.addDocuments(meiliDocuments)
      return meiliDocuments.length
   }

   private async setupIndexSettings() {
      const index = this.getPropertiesIndex()

      await index.updateSettings({
         filterableAttributes: [
            'status',
            'room_type',
            'property_type',
            'city',
            'price_cents',
            'max_guests',
            'bedrooms',
            'beds',
            'amenities',
            '_geo'
         ],
         sortableAttributes: ['price_cents', 'created_at'],
         searchableAttributes: ['title', 'description', 'city', 'address']
      })
      console.log('[Meilisearch] Index settings updated successfully.')
   }
}
