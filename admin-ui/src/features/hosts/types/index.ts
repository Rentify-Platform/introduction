export interface HostProfile {
   accountId: string
   name: string
   email: string
   isSuperhost: boolean
   responseRatePct: number
   kycStatus: string
   createdAt: string
}

export interface ToggleSuperhostRequest {
   isSuperhost: boolean
}
