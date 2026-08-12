import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty } from 'class-validator'

export class UpdateAccountStatusRequest {
   @ApiProperty({
      description: 'Account status',
      enum: ['active', 'suspended', 'banned'],
      example: 'active'
   })
   @IsNotEmpty()
   @IsIn(['active', 'suspended', 'banned'])
   status!: 'active' | 'suspended' | 'banned'
}
