import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import { WishlistItem } from '../../domain/entities/wishlist-item.entity'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'

@Injectable()
export class WishlistPrismaRepository implements WishlistRepository {
   constructor(private readonly prisma: PrismaService) {}

   async findById(id: string): Promise<Wishlist | null> {
      const record = await this.prisma.wishlists.findUnique({
         where: { id },
         include: {
            wishlist_items: {
               include: {
                  properties: {
                     include: {
                        property_photos: {
                           orderBy: { position: 'asc' },
                           take: 1
                        }
                     }
                  }
               }
            }
         }
      })

      if (!record) return null

      const items = record.wishlist_items.map((item) => {
         const photoUrl = item.properties.property_photos[0]?.url || null
         return new WishlistItem(
            item.wishlist_id,
            item.property_id,
            item.properties.title,
            item.properties.base_price_cents,
            photoUrl
         )
      })

      return new Wishlist(record.id, record.account_id, record.name, record.created_at, items)
   }

   async findByAccountId(accountId: string): Promise<Wishlist[]> {
      const records = await this.prisma.wishlists.findMany({
         where: { account_id: accountId },
         include: {
            wishlist_items: {
               include: {
                  properties: {
                     include: {
                        property_photos: {
                           orderBy: { position: 'asc' },
                           take: 1
                        }
                     }
                  }
               }
            }
         },
         orderBy: { created_at: 'desc' }
      })

      return records.map((record) => {
         const items = record.wishlist_items.map((item) => {
            const photoUrl = item.properties.property_photos[0]?.url || null
            return new WishlistItem(
               item.wishlist_id,
               item.property_id,
               item.properties.title,
               item.properties.base_price_cents,
               photoUrl
            )
         })

         return new Wishlist(record.id, record.account_id, record.name, record.created_at, items)
      })
   }

   async save(wishlist: Wishlist): Promise<Wishlist> {
      await this.prisma.wishlists.upsert({
         where: { id: wishlist.id },
         update: {
            name: wishlist.name
         },
         create: {
            id: wishlist.id,
            account_id: wishlist.accountId,
            name: wishlist.name,
            created_at: wishlist.createdAt
         }
      })

      return wishlist
   }

   async delete(id: string): Promise<void> {
      await this.prisma.wishlists.delete({
         where: { id }
      })
   }

   async addItem(wishlistId: string, propertyId: string): Promise<WishlistItem> {
      const record = await this.prisma.wishlist_items.create({
         data: {
            wishlist_id: wishlistId,
            property_id: propertyId
         },
         include: {
            properties: {
               include: {
                  property_photos: {
                     orderBy: { position: 'asc' },
                     take: 1
                  }
               }
            }
         }
      })

      const photoUrl = record.properties.property_photos[0]?.url || null

      return new WishlistItem(
         record.wishlist_id,
         record.property_id,
         record.properties.title,
         record.properties.base_price_cents,
         photoUrl
      )
   }

   async removeItem(wishlistId: string, propertyId: string): Promise<void> {
      await this.prisma.wishlist_items.delete({
         where: {
            wishlist_id_property_id: {
               wishlist_id: wishlistId,
               property_id: propertyId
            }
         }
      })
   }

   async checkPropertyExists(propertyId: string): Promise<boolean> {
      const property = await this.prisma.properties.findUnique({
         where: { id: propertyId }
      })
      return !!property
   }
}
