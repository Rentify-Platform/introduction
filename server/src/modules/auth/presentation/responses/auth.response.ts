export class SignupResponse {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly role: string
   ) {}
}

export class LoginResponse {
   constructor(
      public readonly accessToken: string,
      public readonly user: {
         id: string
         email: string
         role: string
         firstName: string
         lastName: string
      }
   ) {}
}

export class UserProfileResponse {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly phone: string | null,
      public readonly role: string,
      public readonly firstName: string,
      public readonly lastName: string,
      public readonly avatarUrl: string | null,
      public readonly bio: string | null,
      public readonly dateOfBirth: string | null,
      public readonly guestKycStatus: string,
      public readonly createdAt: string
   ) {}
}
