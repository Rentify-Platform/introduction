import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

@Injectable()
export class GetAdminStatsUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async executeOverview() {
      // 1. Get total users
      const totalUsers = await this.prisma.accounts.count({
         where: { deleted_at: null }
      })

      // 2. Get active listings
      const activeListings = await this.prisma.properties.count({
         where: { status: 'active', deleted_at: null }
      })

      // 3. Get pending KYC
      const pendingKycCount = await this.prisma.kyc_documents.count({
         where: { status: 'pending' }
      })

      // 4. Get platform revenue
      const revenueBalance = await this.prisma.ledger_accounts.findFirst({
         where: { owner_type: 'platform', account_subtype: 'revenue', currency: 'VND' },
         include: { ledger_balances: true }
      })
      const platformRevenueCents = revenueBalance?.ledger_balances?.balance_cents || 0n

      return {
         totalUsers,
         activeListings,
         pendingKycCount,
         platformRevenueCents: platformRevenueCents.toString()
      }
   }

   async executeRecentBookings() {
      // 1. Fetch 10 most recent bookings with guest and host info
      const bookings = await this.prisma.bookings.findMany({
         orderBy: { created_at: 'desc' },
         take: 10,
         include: {
            accounts_bookings_guest_idToaccounts: {
               include: { profiles: true }
            },
            accounts_bookings_host_idToaccounts: {
               include: { profiles: true }
            }
         }
      })

      // 2. Map to DTO
      return bookings.map((b) => {
         const guestProfile = b.accounts_bookings_guest_idToaccounts?.profiles
         const hostProfile = b.accounts_bookings_host_idToaccounts?.profiles

         const guestName = guestProfile
            ? `${guestProfile.first_name} ${guestProfile.last_name}`
            : 'Unknown Guest'

         const hostName = hostProfile
            ? `${hostProfile.first_name} ${hostProfile.last_name}`
            : 'Unknown Host'

         return {
            id: b.id,
            guest: guestName,
            host: hostName,
            status: b.status,
            amount: b.total_price_cents.toString(),
            date: b.created_at.toISOString().split('T')[0]
         }
      })
   }
}
