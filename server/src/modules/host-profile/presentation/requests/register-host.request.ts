import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
   IsArray,
   IsDateString,
   IsIn,
   IsNotEmpty,
   IsOptional,
   IsString,
   Length,
   ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

export class IdentityInput {
   @ApiProperty({
      description: 'Document type',
      enum: ['passport', 'national_id', 'drivers_license'],
      example: 'passport'
   })
   @IsNotEmpty()
   @IsString()
   @IsIn(['passport', 'national_id', 'drivers_license'])
   docType: string

   @ApiPropertyOptional({
      description: 'Country code (ISO-2 or ISO-3)',
      example: 'VN',
      nullable: true
   })
   @IsOptional()
   @IsString()
   @Length(2, 3)
   countryCode?: string | null

   @ApiPropertyOptional({ description: 'Document number', example: 'B1234567', nullable: true })
   @IsOptional()
   @IsString()
   documentNumber?: string | null

   @ApiProperty({
      description: 'Front document file URL',
      example: 'https://example.com/front.jpg'
   })
   @IsNotEmpty()
   @IsString()
   fileUrlFront: string

   @ApiPropertyOptional({
      description: 'Back document file URL',
      example: 'https://example.com/back.jpg',
      nullable: true
   })
   @IsOptional()
   @IsString()
   fileUrlBack?: string | null

   @ApiPropertyOptional({
      description: 'Document issue date (ISO)',
      example: '2020-01-01',
      nullable: true
   })
   @IsOptional()
   @IsDateString()
   issueDate?: string | null

   @ApiPropertyOptional({
      description: 'Document expiry date (ISO)',
      example: '2030-01-01',
      nullable: true
   })
   @IsOptional()
   @IsDateString()
   expiryDate?: string | null
}

export class RegisterHostRequest {
   @ApiPropertyOptional({
      description: 'Host identity verification info',
      type: IdentityInput,
      nullable: true
   })
   @IsOptional()
   @ValidateNested()
   @Type(() => IdentityInput)
   identity?: IdentityInput | null

   @ApiProperty({ description: 'Tax country (ISO-2 code)', example: 'VN' })
   @IsNotEmpty()
   @IsString()
   @Length(2, 2)
   taxCountry: string

   @ApiProperty({ description: 'Tax identification number', example: '0123456789' })
   @IsNotEmpty()
   @IsString()
   taxId: string

   @ApiProperty({ description: 'Tax form type', example: 'w8ben' })
   @IsNotEmpty()
   @IsString()
   taxFormType: string

   @ApiProperty({ description: 'Payout provider', example: 'sepay' })
   @IsNotEmpty()
   @IsString()
   payoutProvider: string

   @ApiProperty({ description: 'Payout account ID or bank account number', example: '0901234567' })
   @IsNotEmpty()
   @IsString()
   payoutAccountId: string
}
