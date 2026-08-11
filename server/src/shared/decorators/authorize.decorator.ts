import { SetMetadata } from '@nestjs/common'
import { AccountRole } from '../../modules/auth/domain/account-role.type'

export const ROLES_KEY = 'roles'

export function Authorize(...roles: AccountRole[]) {
   return SetMetadata(ROLES_KEY, roles)
}
