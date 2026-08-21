export interface User {
   id: string
   email: string
   firstName: string
   lastName: string
   role: 'guest' | 'host' | 'admin'
   phone?: string | null
   avatarUrl?: string | null
   bio?: string | null
   dateOfBirth?: string | null
   guestKycStatus?: string
   createdAt?: string
   updatedAt?: string
}

export interface LoginResponse {
   accessToken: string
   user: User
}

export interface ApiResponse<T> {
   success: boolean
   message: string
   data: T
   timestamp: string
}

export class AdminAccessDeniedError extends Error {
   constructor() {
      super('Only administrators can access this system.')
      this.name = 'AdminAccessDeniedError'
   }
}
