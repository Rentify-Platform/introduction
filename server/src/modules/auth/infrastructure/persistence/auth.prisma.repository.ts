import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { Account } from '../../domain/entities/auth.entity'
import {
   AccountRepository,
   FindAllAccountsFilter,
   PaginatedAccounts
} from '../../domain/repositories/auth.repository'
import { account_role, account_status } from '@prisma/client'
import { AccountRole } from '../../domain/account-role.type'

@Injectable()
export class AuthPrismaRepository implements AccountRepository {
   constructor(private readonly prisma: PrismaService) {}

   async findByEmail(email: string): Promise<Account | null> {
      const record = await this.prisma.accounts.findFirst({
         where: {
            email: {
               equals: email,
               mode: 'insensitive'
            },
            deleted_at: null
         },
         include: {
            profiles: true
         }
      })

      if (!record) {
         return null
      }

      return new Account(
         record.id,
         record.email,
         record.phone,
         record.password_hash,
         record.role,
         record.status,
         record.profiles?.first_name || '',
         record.profiles?.last_name || '',
         record.created_at,
         record.updated_at,
         record.profiles?.avatar_url || null,
         record.profiles?.bio || null,
         record.profiles?.date_of_birth || null,
         record.profiles?.guest_kyc_status || 'unverified'
      )
   }

   async findById(id: string): Promise<Account | null> {
      const record = await this.prisma.accounts.findUnique({
         where: {
            id,
            deleted_at: null
         },
         include: {
            profiles: true
         }
      })

      if (!record) {
         return null
      }

      return new Account(
         record.id,
         record.email,
         record.phone,
         record.password_hash,
         record.role,
         record.status,
         record.profiles?.first_name || '',
         record.profiles?.last_name || '',
         record.created_at,
         record.updated_at,
         record.profiles?.avatar_url || null,
         record.profiles?.bio || null,
         record.profiles?.date_of_birth || null,
         record.profiles?.guest_kyc_status || 'unverified'
      )
   }

   async existsByEmail(email: string): Promise<boolean> {
      const count = await this.prisma.accounts.count({
         where: {
            email: {
               equals: email,
               mode: 'insensitive'
            },
            deleted_at: null
         }
      })
      return count > 0
   }

   async save(account: Account): Promise<Account> {
      await this.prisma.$transaction(async (tx) => {
         // 1. Upsert Account
         await tx.accounts.upsert({
            where: { id: account.id },
            update: {
               email: account.email,
               phone: account.phone,
               password_hash: account.passwordHash,
               role: account.role,
               status: account.status,
               updated_at: account.updatedAt
            },
            create: {
               id: account.id,
               email: account.email,
               phone: account.phone,
               password_hash: account.passwordHash,
               role: account.role,
               status: account.status,
               created_at: account.createdAt,
               updated_at: account.updatedAt
            }
         })

         // 2. Upsert Profile
         await tx.profiles.upsert({
            where: { account_id: account.id },
            update: {
               first_name: account.firstName,
               last_name: account.lastName,
               avatar_url: account.avatarUrl,
               bio: account.bio,
               date_of_birth: account.dateOfBirth,
               updated_at: account.updatedAt
            },
            create: {
               account_id: account.id,
               first_name: account.firstName,
               last_name: account.lastName,
               avatar_url: account.avatarUrl,
               bio: account.bio,
               date_of_birth: account.dateOfBirth,
               created_at: account.createdAt,
               updated_at: account.updatedAt
            }
         })
      })

      return account
   }

   async findAll(filter: FindAllAccountsFilter): Promise<PaginatedAccounts> {
      const page = filter.page ?? 1
      const limit = filter.limit ?? 20
      const skip = (page - 1) * limit

      // 1. Build where clause from filters
      const where: Record<string, unknown> = { deleted_at: null }

      if (filter.role) {
         where['role'] = filter.role as account_role
      }

      if (filter.status) {
         where['status'] = filter.status as account_status
      }

      if (filter.search) {
         const term = filter.search.trim()
         where['OR'] = [
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term } },
            { profiles: { first_name: { contains: term, mode: 'insensitive' } } },
            { profiles: { last_name: { contains: term, mode: 'insensitive' } } }
         ]
      }

      // 2. Run count and data queries in parallel
      const [total, records] = await this.prisma.$transaction([
         this.prisma.accounts.count({ where: where as any }),
         this.prisma.accounts.findMany({
            where: where as any,
            include: { profiles: true },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit
         })
      ])

      // 3. Map database records to domain entities
      const data = records.map(
         (record) =>
            new Account(
               record.id,
               record.email,
               record.phone,
               record.password_hash,
               record.role as AccountRole,
               record.status,
               record.profiles?.first_name || '',
               record.profiles?.last_name || '',
               record.created_at,
               record.updated_at,
               record.profiles?.avatar_url || null,
               record.profiles?.bio || null,
               record.profiles?.date_of_birth || null,
               record.profiles?.guest_kyc_status || 'unverified'
            )
      )

      return { data, total, page, limit }
   }

   async updateStatus(
      id: string,
      status: 'active' | 'suspended' | 'banned'
   ): Promise<Account> {
      // 1. Update the account status and return the updated record with profile
      const record = await this.prisma.accounts.update({
         where: { id },
         data: { status: status as account_status, updated_at: new Date() },
         include: { profiles: true }
      })

      return new Account(
         record.id,
         record.email,
         record.phone,
         record.password_hash,
         record.role as AccountRole,
         record.status,
         record.profiles?.first_name || '',
         record.profiles?.last_name || '',
         record.created_at,
         record.updated_at,
         record.profiles?.avatar_url || null,
         record.profiles?.bio || null,
         record.profiles?.date_of_birth || null,
         record.profiles?.guest_kyc_status || 'unverified'
      )
   }
}
