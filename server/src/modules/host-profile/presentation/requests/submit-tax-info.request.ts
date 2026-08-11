import { IsNotEmpty, IsString, Length } from 'class-validator'

export class SubmitTaxInfoRequest {
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
}
