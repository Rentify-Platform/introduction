import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'

@Injectable()
export class ListCancellationsUseCase {
   constructor(private readonly prisma: PrismaService) {}

   async execute(page: number = 1, limit: number = 20, propertyId?: string) {
      const skip = (page - 1) * limit
      const where: any = {}
      if (propertyId) {
         where.bookings = { property_id: propertyId }
      }

      const [data, total] = await Promise.all([
         this.prisma.cancellations.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
               bookings: {
                  include: {
                     properties: { select: { title: true } },
                     accounts_bookings_guest_idToaccounts: {
                        select: {
                           email: true,
                           profiles: { select: { first_name: true, last_name: true } }
                        }
                     },
                     accounts_bookings_host_idToaccounts: {
                        select: {
                           email: true,
                           profiles: { select: { first_name: true, last_name: true } }
                        }
                     }
                  }
               }
            }
         }),
         this.prisma.cancellations.count({ where })
      ])

      return { data, total, page, limit }
   }
}
