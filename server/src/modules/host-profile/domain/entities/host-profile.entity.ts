export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'

export class HostProfile {
   constructor(
      public readonly accountId: string,
      public readonly about: string | null,
      public readonly isSuperhost: boolean,
      public readonly responseRatePct: number | null,
      public readonly avgResponseMinutes: number | null,
      public readonly kycStatus: KycStatus,
      public readonly taxCountry: string | null,
      public readonly taxIdEnc: Buffer | null,
      public readonly taxFormType: string | null,
      public readonly taxVerified: boolean,
      public readonly payoutProvider: string | null,
      public readonly payoutAccountId: string | null,
      public readonly payoutAccountVerified: boolean,
      public readonly becameHostAt: Date,
      public readonly createdAt: Date,
      public readonly updatedAt: Date
   ) {}

   static create(accountId: string): HostProfile {
      return new HostProfile(
         accountId,
         null,
         false,
         null,
         null,
         'unverified',
         null,
         null,
         null,
         false,
         null,
         null,
         false,
         new Date(),
         new Date(),
         new Date()
      )
   }

   updateAbout(about: string | null): HostProfile {
      return new HostProfile(
         this.accountId,
         about,
         this.isSuperhost,
         this.responseRatePct,
         this.avgResponseMinutes,
         this.kycStatus,
         this.taxCountry,
         this.taxIdEnc,
         this.taxFormType,
         this.taxVerified,
         this.payoutProvider,
         this.payoutAccountId,
         this.payoutAccountVerified,
         this.becameHostAt,
         this.createdAt,
         new Date()
      )
   }

   verifyTax(
      taxCountry: string,
      taxIdEnc: Buffer,
      taxFormType: string,
      guestKycStatus: string
   ): HostProfile {
      const updated = new HostProfile(
         this.accountId,
         this.about,
         this.isSuperhost,
         this.responseRatePct,
         this.avgResponseMinutes,
         this.kycStatus,
         taxCountry,
         taxIdEnc,
         taxFormType,
         true, // taxVerified
         this.payoutProvider,
         this.payoutAccountId,
         this.payoutAccountVerified,
         this.becameHostAt,
         this.createdAt,
         new Date()
      )
      return updated.determineKycStatus(guestKycStatus)
   }

   verifyPayout(
      payoutProvider: string,
      payoutAccountId: string,
      guestKycStatus: string
   ): HostProfile {
      const updated = new HostProfile(
         this.accountId,
         this.about,
         this.isSuperhost,
         this.responseRatePct,
         this.avgResponseMinutes,
         this.kycStatus,
         this.taxCountry,
         this.taxIdEnc,
         this.taxFormType,
         this.taxVerified,
         payoutProvider,
         payoutAccountId,
         true, // payoutAccountVerified
         this.becameHostAt,
         this.createdAt,
         new Date()
      )
      return updated.determineKycStatus(guestKycStatus)
   }

   determineKycStatus(guestKycStatus: string): HostProfile {
      let nextStatus: KycStatus = 'unverified'

      // If guest identity check is verified, tax info is verified, and bank account is verified, then host KYC is verified
      if (guestKycStatus === 'verified' && this.taxVerified && this.payoutAccountVerified) {
         nextStatus = 'verified'
      } else if (guestKycStatus === 'rejected') {
         nextStatus = 'rejected'
      } else if (guestKycStatus === 'expired') {
         nextStatus = 'expired'
      } else if (
         guestKycStatus === 'pending' ||
         (guestKycStatus === 'verified' && (this.taxVerified || this.payoutAccountVerified))
      ) {
         // If any verification is in progress/partial, mark as pending
         nextStatus = 'pending'
      }

      return new HostProfile(
         this.accountId,
         this.about,
         this.isSuperhost,
         this.responseRatePct,
         this.avgResponseMinutes,
         nextStatus,
         this.taxCountry,
         this.taxIdEnc,
         this.taxFormType,
         this.taxVerified,
         this.payoutProvider,
         this.payoutAccountId,
         this.payoutAccountVerified,
         this.becameHostAt,
         this.createdAt,
         new Date()
      )
   }
}
