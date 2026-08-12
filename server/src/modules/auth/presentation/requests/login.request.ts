import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginRequest {
   @ApiProperty({ description: 'User email address', example: 'guest@rentify.com' })
   @IsEmail({}, { message: 'Invalid email format' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string

   @ApiProperty({ description: 'User password', example: 'guest123' })
   @IsString()
   @IsNotEmpty({ message: 'Password is required' })
   password: string
}
