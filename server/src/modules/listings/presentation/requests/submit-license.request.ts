import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator'

export class SubmitLicenseRequest {
   @IsNotEmpty()
   @IsString()
   licenseNumber: string

   @IsNotEmpty()
   @IsString()
   issuingAuthority: string

   @IsNotEmpty()
   @IsString()
   fileUrl: string

   @IsOptional()
   @IsDateString()
   expiryDate?: string
}
