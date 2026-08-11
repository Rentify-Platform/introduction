import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator'

export class ReviewKycRequest {
   @IsNotEmpty({ message: 'Action is required' })
   @IsString()
   @IsIn(['approve', 'reject'], { message: "Action must be either 'approve' or 'reject'" })
   action: 'approve' | 'reject'

   @IsOptional()
   @IsString()
   rejectionReason?: string
}
