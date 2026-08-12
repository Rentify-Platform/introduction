import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty } from 'class-validator'

export class UpdatePropertyStatusAdminRequest {
   @ApiProperty({
      description: 'Property status',
      enum: ['active', 'paused', 'archived'],
      example: 'active'
   })
   @IsNotEmpty()
   @IsIn(['active', 'paused', 'archived'])
   status!: 'active' | 'paused' | 'archived'
}
