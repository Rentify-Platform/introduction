export interface CreatePenaltyRequest {
   hostId: string
   bookingId?: string
   penaltyType: string
   amountCents: number
   notes?: string
}

export interface Penalty {
   id: string
   hostId: string
   hostName: string
   hostEmail: string
   bookingId?: string
   penaltyType: string
   amountCents: string
   notes?: string
   createdAt: string
}
