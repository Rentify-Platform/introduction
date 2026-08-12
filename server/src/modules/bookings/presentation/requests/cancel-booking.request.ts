import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class CancelBookingRequest {
   @ApiPropertyOptional({ description: 'Reason for cancellation', example: 'Change of travel plans' })
   @IsString()
   @IsOptional()
   reason?: string
}
