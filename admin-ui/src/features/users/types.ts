export type AccountStatus = 'active' | 'suspended' | 'banned'
export type AccountRole = 'guest' | 'host' | 'admin'

export interface UserAccount {
   id: string
   email: string
   phone: string | null
   role: AccountRole
   status: AccountStatus
   firstName: string
   lastName: string
   avatarUrl: string | null
   guestKycStatus: string
   createdAt: string
}

export interface PaginatedUsers {
   data: UserAccount[]
   total: number
   page: number
   limit: number
}

export interface UsersFilter {
   search?: string
   role?: AccountRole | ''
   status?: AccountStatus | ''
   page?: number
   limit?: number
}
