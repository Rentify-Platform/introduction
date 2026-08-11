import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AccountRole } from '../domain/account-role.type'

export class AuthenticatedUser {
   id: string
   email: string
   role: AccountRole
}

export const CurrentUser = createParamDecorator(
   (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
      const request = ctx.switchToHttp().getRequest()
      return request.user
   }
)
