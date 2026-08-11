import {
   CanActivate,
   ExecutionContext,
   Injectable,
   ForbiddenException,
   UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TokenServicePort } from '../../modules/auth/application/ports/token-service.port'
import { AccountRole } from '../../modules/auth/domain/account-role.type'
import { ROLES_KEY } from '../decorators/authorize.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class GlobalSecurityGuard implements CanActivate {
   constructor(
      private readonly reflector: Reflector,
      private readonly tokenService: TokenServicePort
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

      const request = context.switchToHttp().getRequest()
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
               request.user = {
                  id: payload.sub,
                  email: payload.email,
                  role: payload.role as AccountRole
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

      let userPayload
      try {
         userPayload = await this.tokenService.verifyToken(token)
         request.user = {
            id: userPayload.sub,
            email: userPayload.email,
            role: userPayload.role as AccountRole
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

   private extractTokenFromHeader(request: any): string | null {
      const authHeader = request.headers.authorization
      if (!authHeader) return null
      const [type, token] = authHeader.split(' ')
      return type === 'Bearer' ? token : null
   }
}
