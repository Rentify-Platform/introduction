import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { KycRepository } from '../domain/repositories/kyc.repository'
import { KycPrismaRepository } from './persistence/kyc.prisma.repository'
import { KycProviderPort } from '../application/ports/kyc-provider.port'
import { MockKycProvider } from './providers/mock-kyc-provider'

@Module({
   imports: [PrismaModule],
   providers: [
      {
         provide: KycRepository,
         useClass: KycPrismaRepository
      },
      {
         provide: KycProviderPort,
         useClass: MockKycProvider
      }
   ],
   exports: [KycRepository, KycProviderPort]
})
export class KycInfrastructureModule {}
