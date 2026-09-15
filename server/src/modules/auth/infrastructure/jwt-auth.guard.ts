import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { TokenServicePort } from '../application/ports/token-service.port'
import { AccountRepository } from '../domain/repositories/auth.repository'
import { AccountRole } from '../domain/account-role.type'

type AuthenticatedRequest = {
   headers: { authorization?: string }
   user?: { id: string; email: string; role: AccountRole }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
   constructor(
      private readonly tokenService: TokenServicePort,
      private readonly accountRepository: AccountRepository
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
      const token = this.extractTokenFromHeader(request)
      if (!token) {
         throw new UnauthorizedException('Access token is missing')
      }

      try {
         const payload = await this.tokenService.verifyToken(token)
         const account = await this.accountRepository.findById(payload.sub)
         if (
            !account ||
            account.status !== 'active' ||
            account.tokenVersion !== payload.tokenVersion
         ) {
            throw new UnauthorizedException('Account session is no longer valid')
         }

         // Attach the payload to the request object so it can be accessed in controllers
         request.user = {
            id: payload.sub,
            email: payload.email,
            role: account.role
         }
      } catch {
         throw new UnauthorizedException('Invalid or expired access token')
      }

      return true
   }

   private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | null {
      const authHeader = request.headers.authorization
      if (!authHeader) {
         return null
      }
      const [type, token] = authHeader.split(' ')
      return type === 'Bearer' ? token : null
   }
}
