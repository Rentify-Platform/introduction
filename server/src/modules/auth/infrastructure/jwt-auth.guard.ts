import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { TokenServicePort } from '../application/ports/token-service.port'

@Injectable()
export class JwtAuthGuard implements CanActivate {
   constructor(private readonly tokenService: TokenServicePort) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest()
      const token = this.extractTokenFromHeader(request)
      if (!token) {
         throw new UnauthorizedException('Access token is missing')
      }

      try {
         const payload = await this.tokenService.verifyToken(token)
         // Attach the payload to the request object so it can be accessed in controllers
         request.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role
         }
      } catch (err) {
         throw new UnauthorizedException('Invalid or expired access token')
      }

      return true
   }

   private extractTokenFromHeader(request: any): string | null {
      const authHeader = request.headers.authorization
      if (!authHeader) {
         return null
      }
      const [type, token] = authHeader.split(' ')
      return type === 'Bearer' ? token : null
   }
}
