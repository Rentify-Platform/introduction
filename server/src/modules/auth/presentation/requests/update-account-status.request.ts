import { IsIn, IsNotEmpty } from 'class-validator'

export class UpdateAccountStatusRequest {
   @IsNotEmpty()
   @IsIn(['active', 'suspended', 'banned'])
   status!: 'active' | 'suspended' | 'banned'
}
