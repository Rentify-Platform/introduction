import {
   IsArray,
   IsDateString,
   IsIn,
   IsNotEmpty,
   IsOptional,
   IsString,
   Length,
   ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

export class IdentityInput {
   @IsNotEmpty()
   @IsString()
   @IsIn(['passport', 'national_id', 'drivers_license'])
   docType: string

   @IsOptional()
   @IsString()
   @Length(2, 3)
   countryCode?: string | null

   @IsOptional()
   @IsString()
   documentNumber?: string | null

   @IsNotEmpty()
   @IsString()
   fileUrlFront: string

   @IsOptional()
   @IsString()
   fileUrlBack?: string | null

   @IsOptional()
   @IsDateString()
   issueDate?: string | null

   @IsOptional()
   @IsDateString()
   expiryDate?: string | null
}

export class RegisterHostRequest {
   @IsOptional()
   @ValidateNested()
   @Type(() => IdentityInput)
   identity?: IdentityInput | null

   @IsNotEmpty()
   @IsString()
   @Length(2, 2)
   taxCountry: string

   @IsNotEmpty()
   @IsString()
   taxId: string

   @IsNotEmpty()
   @IsString()
   taxFormType: string

   @IsNotEmpty()
   @IsString()
   payoutProvider: string

   @IsNotEmpty()
   @IsString()
   payoutAccountId: string
}
