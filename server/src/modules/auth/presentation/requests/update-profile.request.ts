import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateProfileRequest {
   @ApiPropertyOptional({ description: 'First name', example: 'John' })
   @IsString()
   @IsNotEmpty({ message: 'First name cannot be empty' })
   @IsOptional()
   firstName?: string

   @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
   @IsString()
   @IsNotEmpty({ message: 'Last name cannot be empty' })
   @IsOptional()
   lastName?: string

   @ApiPropertyOptional({ description: 'Phone number', example: '+84901234567', nullable: true })
   @IsString()
   @IsOptional()
   phone?: string | null

   @ApiPropertyOptional({
      description: 'Bio description',
      example: 'Love traveling and hosting',
      nullable: true
   })
   @IsString()
   @IsOptional()
   bio?: string | null

   @ApiPropertyOptional({
      description: 'Avatar URL',
      example: 'https://example.com/avatar.jpg',
      nullable: true
   })
   @IsString()
   @IsOptional()
   avatarUrl?: string | null

   @ApiPropertyOptional({
      description: 'Date of birth (ISO format)',
      example: '1995-05-15',
      nullable: true
   })
   @IsDateString({}, { message: 'Invalid date format for date of birth' })
   @IsOptional()
   dateOfBirth?: string | null
}
