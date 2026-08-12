import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator'

export class ReviewKycRequest {
   @ApiProperty({ description: 'Review action', enum: ['approve', 'reject'], example: 'approve' })
   @IsNotEmpty({ message: 'Action is required' })
   @IsString()
   @IsIn(['approve', 'reject'], { message: "Action must be either 'approve' or 'reject'" })
   action: 'approve' | 'reject'

   @ApiPropertyOptional({ description: 'Reason for rejection if action is reject', example: 'Image is blurry' })
   @IsOptional()
   @IsString()
   rejectionReason?: string
}
