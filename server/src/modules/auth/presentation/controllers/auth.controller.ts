import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { SignupUseCase, SignupCommand } from '../../application/use-cases/signup.usecase'
import { LoginUseCase, LoginCommand } from '../../application/use-cases/login.usecase'
import { GetMeUseCase, GetMeCommand } from '../../application/use-cases/get-me.usecase'
import {
   UpdateProfileUseCase,
   UpdateProfileCommand
} from '../../application/use-cases/update-profile.usecase'
import { SignupRequest } from '../requests/signup.request'
import { LoginRequest } from '../requests/login.request'
import { UpdateProfileRequest } from '../requests/update-profile.request'
import { AuthMapper } from '../mappers/auth.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../infrastructure/jwt-auth.guard'
import { CurrentUser, AuthenticatedUser } from '../current-user.decorator'

@Controller('auth')
export class AuthController {
   constructor(
      private readonly signupUseCase: SignupUseCase,
      private readonly loginUseCase: LoginUseCase,
      private readonly getMeUseCase: GetMeUseCase,
      private readonly updateProfileUseCase: UpdateProfileUseCase
   ) {}

   @Post('signup')
   async signup(@Body() request: SignupRequest) {
      const command = new SignupCommand(
         request.email,
         request.phone || null,
         request.password,
         request.firstName,
         request.lastName
      )
      const result = await this.signupUseCase.execute(command)
      return ApiResponse.success(
         AuthMapper.toSignupResponse(result),
         'Account created successfully'
      )
   }

   @Post('login')
   async login(@Body() request: LoginRequest) {
      const command = new LoginCommand(request.email, request.password)
      const result = await this.loginUseCase.execute(command)
      return ApiResponse.success(AuthMapper.toLoginResponse(result), 'Logged in successfully')
   }

   @Get('me')
   @UseGuards(JwtAuthGuard)
   async me(@CurrentUser() user: AuthenticatedUser) {
      const command = new GetMeCommand(user.id)
      const result = await this.getMeUseCase.execute(command)
      return ApiResponse.success(
         AuthMapper.toUserProfileResponse(result),
         'Current user profile fetched successfully'
      )
   }

   @Patch('profile')
   @UseGuards(JwtAuthGuard)
   async updateProfile(
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: UpdateProfileRequest
   ) {
      const command = new UpdateProfileCommand(
         user.id,
         request.firstName,
         request.lastName,
         request.phone,
         request.bio,
         request.avatarUrl,
         request.dateOfBirth ? new Date(request.dateOfBirth) : undefined
      )
      const result = await this.updateProfileUseCase.execute(command)
      return ApiResponse.success(
         AuthMapper.toUserProfileResponse(result),
         'Profile updated successfully'
      )
   }
}
