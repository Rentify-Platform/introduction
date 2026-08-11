import { randomUUID } from 'crypto'
import { WishlistItem } from './wishlist-item.entity'
import {
   WishlistItemDuplicateException,
   WishlistItemNotFoundException
} from '../errors/wishlist.errors'

export class Wishlist {
   constructor(
      public readonly id: string,
      public readonly accountId: string,
      public readonly name: string,
      public readonly createdAt: Date,
      public readonly items: WishlistItem[] = []
   ) {}

   static create(accountId: string, name: string): Wishlist {
      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
         throw new Error('Wishlist name cannot be empty')
      }
      return new Wishlist(randomUUID(), accountId, trimmedName, new Date(), [])
   }

   rename(name: string): Wishlist {
      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
         throw new Error('Wishlist name cannot be empty')
      }
      return new Wishlist(this.id, this.accountId, trimmedName, this.createdAt, this.items)
   }

   addItem(propertyId: string): Wishlist {
      const exists = this.items.some((item) => item.propertyId === propertyId)
      if (exists) {
         throw new WishlistItemDuplicateException()
      }

      const newItem = WishlistItem.create(this.id, propertyId)
      return new Wishlist(this.id, this.accountId, this.name, this.createdAt, [
         ...this.items,
         newItem
      ])
   }

   removeItem(propertyId: string): Wishlist {
      const exists = this.items.some((item) => item.propertyId === propertyId)
      if (!exists) {
         throw new WishlistItemNotFoundException()
      }

      const remainingItems = this.items.filter((item) => item.propertyId !== propertyId)
      return new Wishlist(this.id, this.accountId, this.name, this.createdAt, remainingItems)
   }
}
