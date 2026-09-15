import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class UpdateAboutRequest {
   @ApiPropertyOptional({
      description: 'Host about/bio text',
      example: 'Experienced host offering cozy beachfront apartments',
      nullable: true
   })
   @IsOptional()
   @IsString()
   about: string | null
}
