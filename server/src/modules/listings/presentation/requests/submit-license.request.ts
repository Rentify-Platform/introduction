import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator'

export class SubmitLicenseRequest {
   @ApiProperty({ description: 'License registration number', example: 'LIC-998877' })
   @IsNotEmpty()
   @IsString()
   licenseNumber: string

   @ApiProperty({
      description: 'Issuing government authority',
      example: 'Da Nang Department of Tourism'
   })
   @IsNotEmpty()
   @IsString()
   issuingAuthority: string

   @ApiProperty({
      description: 'License document file URL',
      example: 'https://example.com/license.pdf'
   })
   @IsNotEmpty()
   @IsString()
   fileUrl: string

   @ApiPropertyOptional({ description: 'License expiration date (ISO)', example: '2028-12-31' })
   @IsOptional()
   @IsDateString()
   expiryDate?: string
}
