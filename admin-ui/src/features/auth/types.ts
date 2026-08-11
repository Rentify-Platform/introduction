export interface User {
   id: string
   email: string
   firstName: string
   lastName: string
   role: string
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
