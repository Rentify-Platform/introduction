export class PlatformConfig {
   constructor(
      public readonly feeRules: Record<string, unknown>,
      public readonly updatedAt: Date
   ) {}
}
