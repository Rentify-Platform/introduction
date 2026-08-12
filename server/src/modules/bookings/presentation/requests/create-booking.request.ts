import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class CreateBookingRequest {
   @ApiProperty({ description: 'Property ID to book', example: 'd0c2980e-3995-4fee-9b0e-bbadc3651c06' })
   @IsString()
   @IsNotEmpty()
   propertyId: string

   @ApiProperty({ description: 'Check-in date (YYYY-MM-DD)', example: '2026-09-01' })
   @IsString()
   @IsNotEmpty()
   checkIn: string

   @ApiProperty({ description: 'Check-out date (YYYY-MM-DD)', example: '2026-09-05' })
   @IsString()
   @IsNotEmpty()
   checkOut: string

   @ApiProperty({ description: 'Number of guests', example: 2, minimum: 1 })
   @IsNumber()
   @Min(1)
   guestsCount: number
}
