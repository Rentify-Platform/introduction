import { IsOptional, IsString, IsEnum } from 'class-validator'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'

export class GetBalanceQueryRequest {
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

   @IsOptional()
   @IsString()
   currency?: string
}
