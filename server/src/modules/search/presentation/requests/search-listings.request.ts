import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Transform } from 'class-transformer'

export class SearchListingsRequest {
   @IsOptional()
   @IsString()
   query?: string

   @IsOptional()
   @IsString()
   city?: string

   @IsOptional()
   @IsDateString()
   checkIn?: string

   @IsOptional()
   @IsDateString()
   checkOut?: string

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   guests?: number

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   minPrice?: number

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   maxPrice?: number

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   latitude?: number

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   longitude?: number

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   radiusKm?: number

   @IsOptional()
   @IsString()
   roomType?: string

   @IsOptional()
   @IsString()
   propertyType?: string

   @IsOptional()
   @Transform(({ value }) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.split(',')
      return value
   })
   @IsArray()
   @IsString({ each: true })
   amenities?: string[]

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   page?: number = 1

   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   limit?: number = 20

   @IsOptional()
   @IsString()
   sortBy?: string
}
