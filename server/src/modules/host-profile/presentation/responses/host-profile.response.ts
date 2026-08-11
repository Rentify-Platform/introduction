import { KycStatus } from '../../domain/entities/host-profile.entity'

export class HostProfileResponse {
   constructor(
      public readonly accountId: string,
      public readonly about: string | null,
      public readonly isSuperhost: boolean,
      public readonly responseRatePct: number | null,
      public readonly avgResponseMinutes: number | null,
      public readonly kycStatus: KycStatus,
      public readonly taxCountry: string | null,
      public readonly taxFormType: string | null,
      public readonly taxVerified: boolean,
      public readonly payoutProvider: string | null,
      public readonly payoutAccountId: string | null,
      public readonly payoutAccountVerified: boolean,
      public readonly becameHostAt: Date,
      public readonly createdAt: Date,
      public readonly updatedAt: Date
   ) {}
}
