import { Injectable } from '@nestjs/common'
import { KycDocument } from '../../domain/entities/kyc-document.entity'
import { KycRepository } from '../../domain/repositories/kyc.repository'

@Injectable()
export class GetPendingKycUseCase {
   constructor(private readonly kycRepository: KycRepository) {}

   async execute(): Promise<KycDocument[]> {
      return this.kycRepository.findDocumentsByStatus('pending')
   }
}
