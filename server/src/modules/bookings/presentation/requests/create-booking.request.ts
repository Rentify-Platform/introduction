import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class CreateBookingRequest {
   @IsString()
   @IsNotEmpty()
   propertyId: string

   @IsString()
   @IsNotEmpty()
   checkIn: string

   @IsString()
   @IsNotEmpty()
   checkOut: string

   @IsNumber()
   @Min(1)
   guestsCount: number
}
