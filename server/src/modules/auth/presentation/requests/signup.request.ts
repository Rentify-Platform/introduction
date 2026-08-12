import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class SignupRequest {
   @ApiProperty({ description: 'User email address', example: 'user@example.com' })
   @IsEmail({}, { message: 'Invalid email format' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string

   @ApiPropertyOptional({ description: 'Phone number', example: '+84901234567' })
   @IsString()
   @IsOptional()
   phone?: string

   @ApiProperty({ description: 'Password (min 6 chars)', example: 'secret123' })
   @IsString()
   @IsNotEmpty({ message: 'Password is required' })
   @MinLength(6, { message: 'Password must be at least 6 characters long' })
   password: string

   @ApiProperty({ description: 'First name', example: 'John' })
   @IsString()
   @IsNotEmpty({ message: 'First name is required' })
   firstName: string

   @ApiProperty({ description: 'Last name', example: 'Doe' })
   @IsString()
   @IsNotEmpty({ message: 'Last name is required' })
   lastName: string
}
