export abstract class TokenServicePort {
   abstract generateToken(payload: { sub: string; email: string; role: string }): Promise<string>
   abstract verifyToken(token: string): Promise<{ sub: string; email: string; role: string }>
}
