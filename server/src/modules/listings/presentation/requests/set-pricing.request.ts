import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsNumber, IsBoolean, Min } from 'class-validator'

export class SetPricingRequest {
   @ApiProperty({ description: 'Base price per night in cents', example: '100000000' })
   @IsNotEmpty()
   @IsString()
   basePriceCents: string

   @ApiProperty({ description: 'Cleaning fee in cents', example: '20000000' })
   @IsNotEmpty()
   @IsString()
   cleaningFeeCents: string

   @ApiProperty({ description: 'Minimum stay nights', example: 1, minimum: 1 })
   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   minimumNights: number

   @ApiProperty({ description: 'Maximum stay nights', example: 30, minimum: 1 })
   @IsNotEmpty()
   @IsNumber()
   @Min(1)
   maximumNights: number

   @ApiProperty({ description: 'Instant booking enabled', example: true })
   @IsNotEmpty()
   @IsBoolean()
   instantBook: boolean
}
