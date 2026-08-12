import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
   IsArray,
   IsBoolean,
   IsEnum,
   IsNotEmpty,
   IsNumber,
   IsOptional,
   IsString,
   Length,
   Min
} from 'class-validator'

export class UpdateListingRequest {
   @ApiProperty({ description: 'Property type ID', example: 1 })
   @IsNotEmpty()
   @IsNumber()
   propertyTypeId: number

   @ApiProperty({
      description: 'Room type category',
      enum: ['entire_place', 'private_room', 'shared_room', 'hotel_room'],
      example: 'entire_place'
   })
   @IsNotEmpty()
   @IsString()
   @IsEnum(['entire_place', 'private_room', 'shared_room', 'hotel_room'])
   roomType: string

   @ApiProperty({ description: 'Listing title', example: 'Cozy Ocean View Apartment' })
   @IsNotEmpty()
   @IsString()
   @Length(3, 100)
   title: string

   @ApiPropertyOptional({ description: 'Full property description', example: 'Spacious apartment near the beach.' })
   @IsOptional()
   @IsString()
   description?: string

   @ApiProperty({ description: 'Street address line 1', example: '123 Beach Road' })
   @IsNotEmpty()
   @IsString()
   addressLine1: string

   @ApiPropertyOptional({ description: 'Street address line 2 / Apt number', example: 'Apt 4B' })
   @IsOptional()
   @IsString()
   addressLine2?: string

   @ApiProperty({ description: 'City name', example: 'Da Nang' })
   @IsNotEmpty()
   @IsString()
   city: string

   @ApiPropertyOptional({ description: 'State or province', example: 'Da Nang' })
   @IsOptional()
   @IsString()
   stateProvince?: string

   @ApiProperty({ description: 'Country ISO-2 code', example: 'VN' })
   @IsNotEmpty()
   @IsString()
   @Length(2, 2)
   countryCode: string

   @ApiPropertyOptional({ description: 'Postal code', example: '550000' })
   @IsOptional()
   @IsString()
   postalCode?: string

   @ApiProperty({ description: 'GPS Latitude coordinate', example: 16.0544 })
   @IsNotEmpty()
   @IsNumber()
   latitude: number

   @ApiProperty({ description: 'GPS Longitude coordinate', example: 108.2022 })
   @IsNotEmpty()
   @IsNumber()
   longitude: number

   @ApiProperty({ description: 'Maximum guest capacity', example: 4, minimum: 1 })
   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   maxGuests: number

   @ApiPropertyOptional({ description: 'Number of bedrooms', example: 2, default: 0 })
   @IsOptional()
   @IsNumber()
   @Min(0)
   bedrooms?: number

   @ApiPropertyOptional({ description: 'Number of beds', example: 2, default: 0 })
   @IsOptional()
   @IsNumber()
   @Min(0)
   beds?: number

   @ApiPropertyOptional({ description: 'Number of bathrooms', example: 1, default: 0 })
   @IsOptional()
   @IsNumber()
   @Min(0)
   bathrooms?: number

   @ApiProperty({ description: 'Base price per night in cents', example: '100000000' })
   @IsNotEmpty()
   @IsString()
   basePriceCents: string

   @ApiPropertyOptional({ description: 'Cleaning fee in cents', example: '20000000' })
   @IsOptional()
   @IsString()
   cleaningFeeCents?: string

   @ApiPropertyOptional({ description: 'Currency ISO-3 code', example: 'VND', default: 'VND' })
   @IsOptional()
   @IsString()
   currency?: string

   @ApiPropertyOptional({ description: 'Minimum stay nights requirement', example: 1, default: 1 })
   @IsOptional()
   @IsNumber()
   @Min(1)
   minimumNights?: number

   @ApiPropertyOptional({ description: 'Maximum stay nights limit', example: 30, default: 365 })
   @IsOptional()
   @IsNumber()
   @Min(1)
   maximumNights?: number

   @ApiPropertyOptional({ description: 'Check-in time (HH:mm format)', example: '14:00', default: '15:00' })
   @IsOptional()
   @IsString()
   checkInTime?: string

   @ApiPropertyOptional({ description: 'Check-out time (HH:mm format)', example: '12:00', default: '11:00' })
   @IsOptional()
   @IsString()
   checkOutTime?: string

   @ApiPropertyOptional({ description: 'Allows instant booking without host approval', example: false, default: false })
   @IsOptional()
   @IsBoolean()
   instantBook?: boolean

   @ApiPropertyOptional({ description: 'Cancellation policy code', example: 'moderate', default: 'moderate' })
   @IsOptional()
   @IsString()
   cancellationPolicyCode?: string

   @ApiPropertyOptional({ description: 'Indicates if local government rental license is required', example: false, default: false })
   @IsOptional()
   @IsBoolean()
   requiresLocalLicense?: boolean

   @ApiPropertyOptional({ description: 'Array of amenity IDs', example: [1, 2, 3] })
   @IsOptional()
   @IsArray()
   @IsNumber({}, { each: true })
   amenityIds?: number[]

   @ApiPropertyOptional({ description: 'Array of property photo URLs', example: ['https://example.com/photo1.jpg'] })
   @IsOptional()
   @IsArray()
   @IsString({ each: true })
   photoUrls?: string[]
}
