import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator'

export class SignupRequest {
   @IsEmail({}, { message: 'Invalid email format' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string

   @IsString()
   @IsOptional()
   phone?: string

   @IsString()
   @IsNotEmpty({ message: 'Password is required' })
   @MinLength(6, { message: 'Password must be at least 6 characters long' })
   password: string

   @IsString()
   @IsNotEmpty({ message: 'First name is required' })
   firstName: string

   @IsString()
   @IsNotEmpty({ message: 'Last name is required' })
   lastName: string
}
