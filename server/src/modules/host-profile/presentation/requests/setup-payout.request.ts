import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class SetupPayoutRequest {
   @ApiProperty({ description: 'Payout provider name', example: 'sepay' })
   @IsNotEmpty()
   @IsString()
   payoutProvider: string

   @ApiProperty({ description: 'Payout bank account ID or account number', example: '0901234567' })
   @IsNotEmpty()
   @IsString()
   payoutAccountId: string
}
