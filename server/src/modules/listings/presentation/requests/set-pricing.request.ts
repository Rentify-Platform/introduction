import { IsNotEmpty, IsString, IsNumber, IsBoolean, Min } from 'class-validator'

export class SetPricingRequest {
   @IsNotEmpty()
   @IsString()
   basePriceCents: string

   @IsNotEmpty()
   @IsString()
   cleaningFeeCents: string

   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   minimumNights: number

   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   maximumNights: number

   @IsNotEmpty()
   @IsBoolean()
   instantBook: boolean
}
