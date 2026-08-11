import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator'

export class UpdateProfileRequest {
   @IsString()
   @IsNotEmpty({ message: 'First name cannot be empty' })
   @IsOptional()
   firstName?: string

   @IsString()
   @IsNotEmpty({ message: 'Last name cannot be empty' })
   @IsOptional()
   lastName?: string

   @IsString()
   @IsOptional()
   phone?: string | null

   @IsString()
   @IsOptional()
   bio?: string | null

   @IsString()
   @IsOptional()
   avatarUrl?: string | null

   @IsDateString({}, { message: 'Invalid date format for date of birth' })
   @IsOptional()
   dateOfBirth?: string | null
}
