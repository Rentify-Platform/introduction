export interface KycDocument {
   id: string
   accountId: string
   docType: string
   countryCode: string | null
   fileUrlFront: string
   fileUrlBack: string | null
   issueDate: string | null
   expiryDate: string | null
   status: string
   createdAt: string
}
