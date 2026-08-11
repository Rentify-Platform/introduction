import { Module, Global } from '@nestjs/common'
import { MeilisearchService } from './meilisearch.service'
import { OutboxProcessor } from './outbox.processor'
import { PrismaModule } from '../../prisma/prisma.module'

@Global()
@Module({
   imports: [PrismaModule],
   providers: [MeilisearchService, OutboxProcessor],
   exports: [MeilisearchService]
})
export class MeilisearchModule {}
