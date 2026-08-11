import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { HostProfileRepository } from '../domain/repositories/host-profile.repository'
import { HostProfilePrismaRepository } from './persistence/host-profile.prisma.repository'
import { EncryptionPort } from '../application/ports/encryption.port'
import { CryptoService } from './providers/crypto.service'

@Module({
   imports: [PrismaModule],
   providers: [
      {
         provide: HostProfileRepository,
         useClass: HostProfilePrismaRepository
      },
      {
         provide: EncryptionPort,
         useClass: CryptoService
      }
   ],
   exports: [HostProfileRepository, EncryptionPort]
})
export class HostProfileInfrastructureModule {}
