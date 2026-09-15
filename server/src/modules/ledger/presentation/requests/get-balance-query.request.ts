import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum } from 'class-validator'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'

export class GetBalanceQueryRequest {
   @ApiPropertyOptional({
      description: 'Ledger Account ID',
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

   @ApiPropertyOptional({ description: 'Currency code', example: 'VND' })
   @IsOptional()
   @IsString()
   currency?: string
}
