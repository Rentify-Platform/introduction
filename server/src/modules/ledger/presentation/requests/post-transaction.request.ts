import {
   IsNotEmpty,
   IsString,
   IsOptional,
   IsEnum,
   IsArray,
   ValidateNested,
   IsNumber
} from 'class-validator'
import { Type } from 'class-transformer'

export class PostTransactionEntryRequest {
   @IsOptional()
   @IsString()
   ledgerAccountId?: string

   @IsOptional()
   @IsEnum(['platform', 'host', 'guest', 'tax_authority'])
   ownerType?: string

   @IsOptional()
   @IsString()
   ownerAccountId?: string

   @IsOptional()
   @IsString()
   accountSubtype?: string

   @IsNotEmpty()
   @IsNumber()
   amountCents: number // passed as number from json, converted to bigint

   @IsNotEmpty()
   @IsString()
   currency: string
}

export class PostTransactionRequest {
   @IsNotEmpty()
   @IsString()
   idempotencyKey: string

   @IsNotEmpty()
   @IsEnum([
      'booking_payment',
      'platform_fee',
      'host_accrual',
      'refund',
      'payout',
      'tax_remittance',
      'adjustment'
   ])
   type: string

   @IsOptional()
   @IsString()
   bookingId?: string

   @IsOptional()
   @IsString()
   description?: string

   @IsOptional()
   metadata?: any

   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => PostTransactionEntryRequest)
   entries: PostTransactionEntryRequest[]
}
