import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

export class SubmitTaxInfoRequest {
   @ApiProperty({ description: 'Tax country (ISO-2 code)', example: 'VN' })
   @IsNotEmpty()
   @IsString()
   @Length(2, 2)
   taxCountry: string

   @ApiProperty({ description: 'Tax identification number', example: '0123456789' })
   @IsNotEmpty()
   @IsString()
   taxId: string

   @ApiProperty({ description: 'Tax form type', example: 'w8ben' })
   @IsNotEmpty()
   @IsString()
   taxFormType: string
}
