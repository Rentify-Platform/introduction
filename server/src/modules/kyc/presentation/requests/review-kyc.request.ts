import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsIn, ValidateIf } from 'class-validator'

export class ReviewKycRequest {
   @ApiProperty({ description: 'Review action', enum: ['approve', 'reject'], example: 'approve' })
   @IsNotEmpty({ message: 'Action is required' })
   @IsString()
   @IsIn(['approve', 'reject'], { message: "Action must be either 'approve' or 'reject'" })
   action: 'approve' | 'reject'

   @ApiPropertyOptional({
      description: 'Reason for rejection if action is reject',
      example: 'Image is blurry'
   })
   @ValidateIf((request: ReviewKycRequest) => request.action === 'reject')
   @IsNotEmpty({ message: 'Rejection reason is required when rejecting a KYC document' })
   @IsString()
   rejectionReason?: string
}
