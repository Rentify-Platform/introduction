import { apiClient } from '@/lib/api/api-client'
import { ApiResponse, LoginResponse, User } from '../types'
import { LoginInput } from '../schemas/auth-schema'

export const authService = {
   async login(data: LoginInput): Promise<ApiResponse<LoginResponse>> {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data)
      return response.data
   },

   async getMe(): Promise<ApiResponse<User>> {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me')
      return response.data
   }
}
