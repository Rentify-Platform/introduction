import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../../../prisma/prisma.module'
import { AccountRepository } from '../domain/repositories/auth.repository'
import { AuthPrismaRepository } from './persistence/auth.prisma.repository'
import { PasswordHasherPort } from '../application/ports/password-hasher.port'
import { BcryptPasswordHasher } from './providers/bcrypt-password-hasher'
import { TokenServicePort } from '../application/ports/token-service.port'
import { JwtTokenService } from './providers/jwt-token-service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Module({
   imports: [
      PrismaModule,
      JwtModule.register({
         secret: process.env.JWT_SECRET || 'rentify-secret-key-change-me',
         signOptions: { expiresIn: '1d' }
      })
   ],
   providers: [
      {
         provide: AccountRepository,
         useClass: AuthPrismaRepository
      },
      {
         provide: PasswordHasherPort,
         useClass: BcryptPasswordHasher
      },
      {
         provide: TokenServicePort,
         useClass: JwtTokenService
      },
      JwtAuthGuard
   ],
   exports: [AccountRepository, PasswordHasherPort, TokenServicePort, JwtAuthGuard]
})
export class AuthInfrastructureModule {}
