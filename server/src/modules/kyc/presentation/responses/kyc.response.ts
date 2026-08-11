export class SubmitKycResponse {
   constructor(
      public readonly documentId: string,
      public readonly status: string,
      public readonly verificationResult: string
   ) {}
}

export class ReviewKycResponse {
   constructor(
      public readonly documentId: string,
      public readonly status: string
   ) {}
}

export class RescreenKycResponse {
   constructor(
      public readonly totalRescreened: number,
      public readonly passedCount: number,
      public readonly failedCount: number
   ) {}
}
