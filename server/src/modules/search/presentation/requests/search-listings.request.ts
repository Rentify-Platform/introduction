import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Transform } from 'class-transformer'

export class SearchListingsRequest {
   @ApiPropertyOptional({
      description: 'Text search query for title, description or location',
      example: 'beach villa'
   })
   @IsOptional()
   @IsString()
   query?: string

   @ApiPropertyOptional({ description: 'City name filter', example: 'Da Nang' })
   @IsOptional()
   @IsString()
   city?: string

   @ApiPropertyOptional({ description: 'Check-in date (ISO)', example: '2026-09-01' })
   @IsOptional()
   @IsDateString()
   checkIn?: string

   @ApiPropertyOptional({ description: 'Check-out date (ISO)', example: '2026-09-05' })
   @IsOptional()
   @IsDateString()
   checkOut?: string

   @ApiPropertyOptional({
      description: 'Minimum number of guests required',
      example: 2,
      minimum: 1
   })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   guests?: number

   @ApiPropertyOptional({
      description: 'Minimum base price per night in cents',
      example: 50000000,
      minimum: 0
   })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   minPrice?: number

   @ApiPropertyOptional({
      description: 'Maximum base price per night in cents',
      example: 500000000,
      minimum: 0
   })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   maxPrice?: number

   @ApiPropertyOptional({ description: 'GPS Latitude for geo search', example: 16.0544 })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   latitude?: number

   @ApiPropertyOptional({ description: 'GPS Longitude for geo search', example: 108.2022 })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   longitude?: number

   @ApiPropertyOptional({ description: 'Search radius in kilometers', example: 10, minimum: 0 })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(0)
   radiusKm?: number

   @ApiPropertyOptional({ description: 'Room type filter', example: 'entire_place' })
   @IsOptional()
   @IsString()
   roomType?: string

   @ApiPropertyOptional({ description: 'Property type filter', example: 'Apartment' })
   @IsOptional()
   @IsString()
   propertyType?: string

   @ApiPropertyOptional({
      description: 'List or comma-separated amenity names',
      example: ['wifi', 'pool']
   })
   @IsOptional()
   @Transform(({ value }) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.split(',')
      return value
   })
   @IsArray()
   @IsString({ each: true })
   amenities?: string[]

   @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   page?: number = 1

   @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
   @IsOptional()
   @Transform(({ value }) => Number(value))
   @IsNumber()
   @Min(1)
   limit?: number = 20

   @ApiPropertyOptional({
      description: 'Sort criteria (e.g. price:asc, rating:desc)',
      example: 'price:asc'
   })
   @IsOptional()
   @IsString()
   sortBy?: string
}
