import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { HostProfile, KycStatus } from '../../domain/entities/host-profile.entity'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'
import { kyc_status } from '@prisma/client'

@Injectable()
export class HostProfilePrismaRepository implements HostProfileRepository {
   constructor(private readonly prisma: PrismaService) {}

   async findByAccountId(accountId: string): Promise<HostProfile | null> {
      const record = await this.prisma.host_profiles.findUnique({
         where: { account_id: accountId }
      })

      if (!record) return null

      return new HostProfile(
         record.account_id,
         record.about,
         record.is_superhost,
         record.response_rate_pct,
         record.avg_response_minutes,
         record.kyc_status,
         record.tax_country,
         record.tax_id_enc ? Buffer.from(record.tax_id_enc) : null,
         record.tax_form_type,
         record.tax_verified,
         record.payout_provider,
         record.payout_account_id,
         record.payout_account_verified,
         record.became_host_at,
         record.created_at,
         record.updated_at
      )
   }

   async save(hostProfile: HostProfile): Promise<HostProfile> {
      await this.prisma.host_profiles.upsert({
         where: { account_id: hostProfile.accountId },
         update: {
            about: hostProfile.about,
            is_superhost: hostProfile.isSuperhost,
            response_rate_pct: hostProfile.responseRatePct,
            avg_response_minutes: hostProfile.avgResponseMinutes,
            kyc_status: hostProfile.kycStatus,
            tax_country: hostProfile.taxCountry,
            tax_id_enc: hostProfile.taxIdEnc as any,
            tax_form_type: hostProfile.taxFormType,
            tax_verified: hostProfile.taxVerified,
            payout_provider: hostProfile.payoutProvider,
            payout_account_id: hostProfile.payoutAccountId,
            payout_account_verified: hostProfile.payoutAccountVerified,
            updated_at: hostProfile.updatedAt
         },
         create: {
            account_id: hostProfile.accountId,
            about: hostProfile.about,
            is_superhost: hostProfile.isSuperhost,
            response_rate_pct: hostProfile.responseRatePct,
            avg_response_minutes: hostProfile.avgResponseMinutes,
            kyc_status: hostProfile.kycStatus,
            tax_country: hostProfile.taxCountry,
            tax_id_enc: hostProfile.taxIdEnc as any,
            tax_form_type: hostProfile.taxFormType,
            tax_verified: hostProfile.taxVerified,
            payout_provider: hostProfile.payoutProvider,
            payout_account_id: hostProfile.payoutAccountId,
            payout_account_verified: hostProfile.payoutAccountVerified,
            became_host_at: hostProfile.becameHostAt,
            created_at: hostProfile.createdAt,
            updated_at: hostProfile.updatedAt
         }
      })

      return hostProfile
   }

   async getGuestKycStatus(accountId: string): Promise<string> {
      const profile = await this.prisma.profiles.findUnique({
         where: { account_id: accountId }
      })

      return profile?.guest_kyc_status || 'unverified'
   }

   async updateAccountRoleToHost(accountId: string): Promise<void> {
      await this.prisma.accounts.update({
         where: { id: accountId },
         data: { role: 'host' }
      })
   }
}
