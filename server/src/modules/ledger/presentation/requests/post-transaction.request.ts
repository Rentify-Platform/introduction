import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
   @ApiPropertyOptional({
      description: 'Ledger account ID',
      example: 'd0c2980e-3995-4fee-9b0e-bbadc3651c06'
   })
   @IsOptional()
   @IsString()
   ledgerAccountId?: string

   @ApiPropertyOptional({
      description: 'Owner type',
      enum: ['platform', 'host', 'guest', 'tax_authority'],
      example: 'host'
   })
   @IsOptional()
   @IsEnum(['platform', 'host', 'guest', 'tax_authority'])
   ownerType?: string

   @ApiPropertyOptional({
      description: 'Owner account ID',
      example: 'd0c2980e-3995-4fee-9b0e-bbadc3651c06'
   })
   @IsOptional()
   @IsString()
   ownerAccountId?: string

   @ApiPropertyOptional({ description: 'Account subtype', example: 'payable' })
   @IsOptional()
   @IsString()
   accountSubtype?: string

   @ApiProperty({ description: 'Transaction entry amount in cents', example: 100000 })
   @IsNotEmpty()
   @IsNumber()
   amountCents: number // passed as number from json, converted to bigint

   @ApiProperty({ description: 'Currency code', example: 'VND' })
   @IsNotEmpty()
   @IsString()
   currency: string
}

export class PostTransactionRequest {
   @ApiProperty({
      description: 'Unique idempotency key to prevent double posting',
      example: 'tx-12345-abc'
   })
   @IsNotEmpty()
   @IsString()
   idempotencyKey: string

   @ApiProperty({
      description: 'Transaction type',
      enum: [
         'booking_payment',
         'platform_fee',
         'host_accrual',
         'refund',
         'payout',
         'tax_remittance',
         'adjustment'
      ],
      example: 'booking_payment'
   })
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

   @ApiPropertyOptional({
      description: 'Associated booking ID',
      example: '7c123f66-a264-4ec8-b010-09350fbcc27c'
   })
   @IsOptional()
   @IsString()
   bookingId?: string

   @ApiPropertyOptional({
      description: 'Transaction description',
      example: 'Booking payout for reservation'
   })
   @IsOptional()
   @IsString()
   description?: string

   @ApiPropertyOptional({
      description: 'Arbitrary metadata JSON object',
      example: { note: 'manual adjustment' }
   })
   @IsOptional()
   metadata?: any

   @ApiProperty({
      description: 'List of double-entry transaction lines',
      type: [PostTransactionEntryRequest]
   })
   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => PostTransactionEntryRequest)
   entries: PostTransactionEntryRequest[]
}
