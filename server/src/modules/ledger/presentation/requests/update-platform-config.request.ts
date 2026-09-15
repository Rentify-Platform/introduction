import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsObject } from 'class-validator'

export class UpdatePlatformConfigRequest {
   @ApiProperty({
      description: 'Platform fee rules JSON object',
      example: { default_pct: 12 }
   })
   @IsNotEmpty()
   @IsObject()
   feeRules!: Record<string, unknown>
}
