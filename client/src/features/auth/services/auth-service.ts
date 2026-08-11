import { apiClient } from '@/lib/api/api-client'
import { ApiResponse, LoginResponse, SignupResponse, User } from '../types'
import { LoginInput, SignupInput } from '../schemas/auth-schema'

export const authService = {
   async signup(data: SignupInput): Promise<ApiResponse<SignupResponse>> {
      const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/signup', data)
      return response.data
   },

   async login(data: LoginInput): Promise<ApiResponse<LoginResponse>> {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data)
      return response.data
   },

   async getMe(): Promise<ApiResponse<User>> {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me')
      return response.data
   },

   async updateProfile(data: {
      firstName?: string
      lastName?: string
      phone?: string | null
      bio?: string | null
      avatarUrl?: string | null
      dateOfBirth?: string | null
   }): Promise<ApiResponse<User>> {
      const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', data)
      return response.data
   }
}
