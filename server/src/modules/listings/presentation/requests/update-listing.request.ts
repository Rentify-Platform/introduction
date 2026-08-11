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
   @IsNotEmpty()
   @IsNumber()
   propertyTypeId: number

   @IsNotEmpty()
   @IsString()
   @IsEnum(['entire_place', 'private_room', 'shared_room', 'hotel_room'])
   roomType: string

   @IsNotEmpty()
   @IsString()
   @Length(3, 100)
   title: string

   @IsOptional()
   @IsString()
   description?: string

   @IsNotEmpty()
   @IsString()
   addressLine1: string

   @IsOptional()
   @IsString()
   addressLine2?: string

   @IsNotEmpty()
   @IsString()
   city: string

   @IsOptional()
   @IsString()
   stateProvince?: string

   @IsNotEmpty()
   @IsString()
   @Length(2, 2)
   countryCode: string

   @IsOptional()
   @IsString()
   postalCode?: string

   @IsNotEmpty()
   @IsNumber()
   latitude: number

   @IsNotEmpty()
   @IsNumber()
   longitude: number

   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   maxGuests: number

   @IsOptional()
   @IsNumber()
   @Min(0)
   bedrooms?: number

   @IsOptional()
   @IsNumber()
   @Min(0)
   beds?: number

   @IsOptional()
   @IsNumber()
   @Min(0)
   bathrooms?: number

   @IsNotEmpty()
   @IsString()
   basePriceCents: string

   @IsOptional()
   @IsString()
   cleaningFeeCents?: string

   @IsOptional()
   @IsString()
   currency?: string

   @IsOptional()
   @IsNumber()
   @Min(1)
   minimumNights?: number

   @IsOptional()
   @IsNumber()
   @Min(1)
   maximumNights?: number

   @IsOptional()
   @IsString()
   checkInTime?: string

   @IsOptional()
   @IsString()
   checkOutTime?: string

   @IsOptional()
   @IsBoolean()
   instantBook?: boolean

   @IsOptional()
   @IsString()
   cancellationPolicyCode?: string

   @IsOptional()
   @IsBoolean()
   requiresLocalLicense?: boolean

   @IsOptional()
   @IsArray()
   @IsNumber({}, { each: true })
   amenityIds?: number[]

   @IsOptional()
   @IsArray()
   @IsString({ each: true })
   photoUrls?: string[]
}
