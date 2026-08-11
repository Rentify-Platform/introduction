import { randomUUID } from 'crypto'
import { AccountRole } from '../account-role.type'

export class Account {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly phone: string | null,
      public readonly passwordHash: string | null,
      public readonly role: AccountRole,
      public readonly status: 'active' | 'suspended' | 'banned' | 'deleted',
      public readonly firstName: string,
      public readonly lastName: string,
      public readonly createdAt: Date,
      public readonly updatedAt: Date,
      public readonly avatarUrl: string | null = null,
      public readonly bio: string | null = null,
      public readonly dateOfBirth: Date | null = null,
      public readonly guestKycStatus: string = 'unverified'
   ) {}

   static create(params: {
      id?: string
      email: string
      phone?: string | null
      passwordHash: string
      role?: AccountRole
      firstName: string
      lastName: string
      avatarUrl?: string | null
      bio?: string | null
      dateOfBirth?: Date | null
      guestKycStatus?: string
   }): Account {
      // Basic domain validation
      if (!params.email.includes('@')) {
         throw new Error('Invalid email address')
      }
      if (params.firstName.trim().length === 0 || params.lastName.trim().length === 0) {
         throw new Error('First name and last name cannot be empty')
      }

      return new Account(
         params.id || randomUUID(),
         params.email.toLowerCase().trim(),
         params.phone || null,
         params.passwordHash,
         params.role || 'guest',
         'active',
         params.firstName.trim(),
         params.lastName.trim(),
         new Date(),
         new Date(),
         params.avatarUrl || null,
         params.bio || null,
         params.dateOfBirth || null,
         params.guestKycStatus || 'unverified'
      )
   }
}
