import { IsIn, IsNotEmpty } from 'class-validator'

export class UpdatePropertyStatusAdminRequest {
   @IsNotEmpty()
   @IsIn(['active', 'paused', 'archived'])
   status!: 'active' | 'paused' | 'archived'
}
