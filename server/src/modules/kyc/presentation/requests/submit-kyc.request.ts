import { IsNotEmpty, IsString, IsOptional, IsIn, IsDateString } from 'class-validator'

export class SubmitKycRequest {
   @IsNotEmpty({ message: 'Document type is required' })
   @IsString()
   @IsIn(
      [
         'passport',
         'national_id',
         'drivers_license',
         'utility_bill',
         'tax_document',
         'bank_statement',
         'business_license'
      ],
      { message: 'Invalid document type' }
   )
   docType: string

   @IsOptional()
   @IsString()
   countryCode?: string

   @IsOptional()
   @IsString()
   documentNumber?: string

   @IsNotEmpty({ message: 'Front image URL is required' })
   @IsString()
   fileUrlFront: string

   @IsOptional()
   @IsString()
   fileUrlBack?: string

   @IsOptional()
   @IsDateString({}, { message: 'Invalid issue date' })
   issueDate?: string

   @IsOptional()
   @IsDateString({}, { message: 'Invalid expiry date' })
   expiryDate?: string
}
