import {
   CanActivate,
   ExecutionContext,
   Injectable,
   ForbiddenException,
   UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
   TokenPayload,
   TokenServicePort
} from '../../modules/auth/application/ports/token-service.port'
import { AccountRepository } from '../../modules/auth/domain/repositories/auth.repository'
import { AccountRole } from '../../modules/auth/domain/account-role.type'
import { ROLES_KEY } from '../decorators/authorize.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

type SecurityRequest = {
   url: string
   headers: { authorization?: string }
   user?: { id: string; email: string; role: AccountRole }
}

@Injectable()
export class GlobalSecurityGuard implements CanActivate {
   constructor(
      private readonly reflector: Reflector,
      private readonly tokenService: TokenServicePort,
      private readonly accountRepository: AccountRepository
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      // 1. Check if the endpoint is marked as Public
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
         context.getHandler(),
         context.getClass()
      ])
      if (isPublic) {
         return true
      }

      const request = context.switchToHttp().getRequest<SecurityRequest>()
      const path = request.url

      // 2. Resolve metadata-based roles
      const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(ROLES_KEY, [
         context.getHandler(),
         context.getClass()
      ])

      const hasRolesMetadata = requiredRoles !== undefined

      // Check if path is prefixed with admin
      const isAdminPath = path.startsWith('/admin') || path.startsWith('/api/admin')

      // If not an admin path and no @Authorize decorator is present, allow request to proceed
      if (!isAdminPath && !hasRolesMetadata) {
         // Try to parse token if present for @CurrentUser decorator usage on public/mixed endpoints
         const token = this.extractTokenFromHeader(request)
         if (token) {
            try {
               const payload = await this.tokenService.verifyToken(token)
               const account = await this.accountRepository.findById(payload.sub)
               if (
                  account &&
                  account.status === 'active' &&
                  account.tokenVersion === payload.tokenVersion
               ) {
                  request.user = {
                     id: payload.sub,
                     email: payload.email,
                     role: account.role
                  }
               }
            } catch {
               // Ignore token parsing error for public endpoints
            }
         }
         return true
      }

      // 3. Authenticate JWT token
      const token = this.extractTokenFromHeader(request)
      if (!token) {
         throw new UnauthorizedException('Access token is missing')
      }

      let userPayload: TokenPayload
      try {
         userPayload = await this.tokenService.verifyToken(token)
         const account = await this.accountRepository.findById(userPayload.sub)
         if (
            !account ||
            account.status !== 'active' ||
            account.tokenVersion !== userPayload.tokenVersion
         ) {
            throw new UnauthorizedException('Account session is no longer valid')
         }

         request.user = {
            id: userPayload.sub,
            email: userPayload.email,
            role: account.role
         }
      } catch {
         throw new UnauthorizedException('Invalid or expired access token')
      }

      // 4. Role Authorization
      const rolesToCheck =
         requiredRoles && requiredRoles.length > 0
            ? requiredRoles
            : isAdminPath
              ? ['admin' as AccountRole]
              : []

      if (rolesToCheck.length > 0) {
         const hasRole = rolesToCheck.includes(request.user.role)
         if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource')
         }
      }

      return true
   }

   private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | null {
      const authHeader = request.headers.authorization
      if (!authHeader) return null
      const [type, token] = authHeader.split(' ')
      return type === 'Bearer' ? token : null
   }
}
