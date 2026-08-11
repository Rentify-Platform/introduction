import { IsNotEmpty, IsString } from 'class-validator'

export class SetupPayoutRequest {
   @IsNotEmpty()
   @IsString()
   payoutProvider: string

   @IsNotEmpty()
   @IsString()
   payoutAccountId: string
}
