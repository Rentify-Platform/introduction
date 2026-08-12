import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

export class CreateWishlistRequest {
   @ApiProperty({ description: 'Wishlist collection name', example: 'Summer Vacation Homes' })
   @IsNotEmpty()
   @IsString()
   @Length(1, 50)
   name: string
}
