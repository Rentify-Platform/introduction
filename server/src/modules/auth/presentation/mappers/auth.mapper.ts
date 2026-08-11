import { SignupResult } from '../../application/use-cases/signup.usecase'
import { LoginResult } from '../../application/use-cases/login.usecase'
import { SignupResponse, LoginResponse, UserProfileResponse } from '../responses/auth.response'
import { GetMeResult } from '../../application/use-cases/get-me.usecase'
import { UpdateProfileResult } from '../../application/use-cases/update-profile.usecase'

export class AuthMapper {
   static toSignupResponse(result: SignupResult): SignupResponse {
      return new SignupResponse(result.id, result.email, result.role)
   }

   static toLoginResponse(result: LoginResult): LoginResponse {
      return new LoginResponse(result.accessToken, result.account)
   }

   static toUserProfileResponse(result: GetMeResult | UpdateProfileResult): UserProfileResponse {
      return new UserProfileResponse(
         result.id,
         result.email,
         result.phone,
         result.role,
         result.firstName,
         result.lastName,
         result.avatarUrl,
         result.bio,
         result.dateOfBirth ? result.dateOfBirth.toISOString().split('T')[0] : null,
         result.guestKycStatus,
         result.createdAt.toISOString()
      )
   }
}
