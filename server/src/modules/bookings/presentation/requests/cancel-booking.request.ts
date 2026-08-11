import { IsOptional, IsString } from 'class-validator'

export class CancelBookingRequest {
   @IsString()
   @IsOptional()
   reason?: string
}
