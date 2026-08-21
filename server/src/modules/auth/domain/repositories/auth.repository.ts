import { Account } from '../entities/auth.entity'

export interface FindAllAccountsFilter {
   search?: string
   role?: string
   status?: string
   page?: number
   limit?: number
}

export interface PaginatedAccounts {
   data: Account[]
   total: number
   page: number
   limit: number
}

export abstract class AccountRepository {
   abstract findByEmail(email: string): Promise<Account | null>
   abstract findById(id: string): Promise<Account | null>
   abstract save(account: Account): Promise<Account>
   abstract existsByEmail(email: string): Promise<boolean>
   abstract findAll(filter: FindAllAccountsFilter): Promise<PaginatedAccounts>
   abstract updateStatus(id: string, status: 'active' | 'suspended' | 'banned'): Promise<Account>
}
