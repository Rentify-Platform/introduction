export interface TokenPayload {
   sub: string
   email: string
   role: string
   tokenVersion: number
}

export abstract class TokenServicePort {
   abstract generateToken(payload: {
      sub: string
      email: string
      role: string
      tokenVersion: number
   }): Promise<string>
   abstract verifyToken(token: string): Promise<TokenPayload>
}
