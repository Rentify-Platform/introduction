import { HostProfile } from '../../domain/entities/host-profile.entity'
import { HostProfileResponse } from '../responses/host-profile.response'

export class HostProfileMapper {
   static toResponse(profile: HostProfile): HostProfileResponse {
      return new HostProfileResponse(
         profile.accountId,
         profile.about,
         profile.isSuperhost,
         profile.responseRatePct,
         profile.avgResponseMinutes,
         profile.kycStatus,
         profile.taxCountry,
         profile.taxFormType,
         profile.taxVerified,
         profile.payoutProvider,
         profile.payoutAccountId,
         profile.payoutAccountVerified,
         profile.becameHostAt,
         profile.createdAt,
         profile.updatedAt
      )
   }
}
