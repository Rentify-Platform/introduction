import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsIn, IsDateString } from 'class-validator'

export class SubmitKycRequest {
   @ApiProperty({
      description: 'Document type',
      enum: [
         'passport',
         'national_id',
         'drivers_license',
         'utility_bill',
         'tax_document',
         'bank_statement',
         'business_license'
      ],
      example: 'passport'
   })
   @IsNotEmpty({ message: 'Document type is required' })
   @IsString()
   @IsIn(
      [
         'passport',
         'national_id',
         'drivers_license',
         'utility_bill',
         'tax_document',
         'bank_statement',
         'business_license'
      ],
      { message: 'Invalid document type' }
   )
   docType: string

   @ApiPropertyOptional({ description: 'Country code (ISO-2 or ISO-3)', example: 'VN' })
   @IsOptional()
   @IsString()
   countryCode?: string

   @ApiPropertyOptional({ description: 'Document number', example: '123456789' })
   @IsOptional()
   @IsString()
   documentNumber?: string

   @ApiProperty({ description: 'Front side document image/file URL', example: 'https://example.com/kyc-front.jpg' })
   @IsNotEmpty({ message: 'Front image URL is required' })
   @IsString()
   fileUrlFront: string

   @ApiPropertyOptional({ description: 'Back side document image/file URL', example: 'https://example.com/kyc-back.jpg' })
   @IsOptional()
   @IsString()
   fileUrlBack?: string

   @ApiPropertyOptional({ description: 'Document issue date (ISO)', example: '2021-01-01' })
   @IsOptional()
   @IsDateString({}, { message: 'Invalid issue date' })
   issueDate?: string

   @ApiPropertyOptional({ description: 'Document expiry date (ISO)', example: '2031-01-01' })
   @IsOptional()
   @IsDateString({}, { message: 'Invalid expiry date' })
   expiryDate?: string
}
