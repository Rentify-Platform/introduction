import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { LedgerRepository } from '../domain/repositories/ledger.repository'
import { LedgerPrismaRepository } from './persistence/ledger.prisma.repository'

@Module({
   imports: [PrismaModule],
   providers: [
      {
         provide: LedgerRepository,
         useClass: LedgerPrismaRepository
      }
   ],
   exports: [LedgerRepository]
})
export class LedgerInfrastructureModule {}
