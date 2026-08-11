import { IsOptional, IsString } from 'class-validator'

export class UpdateAboutRequest {
   @IsOptional()
   @IsString()
   about: string | null
}
