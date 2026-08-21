import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class OverrideCancellationRequest {
   @ApiProperty({ example: 'Guest provided medical emergency proof' })
   @IsString()
   @IsNotEmpty()
   overrideReason: string

   @ApiProperty({ example: 500000 })
   @IsNumber()
   @Min(0)
   guestRefundCents: number

   @ApiProperty({ example: 0 })
   @IsNumber()
   @Min(0)
   hostPayoutCents: number

   @ApiProperty({ example: 0 })
   @IsNumber()
   @Min(0)
   platformFeeKeptCents: number
}
