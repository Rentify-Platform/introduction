import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenServicePort } from '../../application/ports/token-service.port'

@Injectable()
export class JwtTokenService implements TokenServicePort {
   constructor(private readonly jwtService: JwtService) {}

   async generateToken(payload: { sub: string; email: string; role: string }): Promise<string> {
      return this.jwtService.signAsync(payload)
   }

   async verifyToken(token: string): Promise<{ sub: string; email: string; role: string }> {
      return this.jwtService.verifyAsync(token)
   }
}
