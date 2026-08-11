import 'dotenv/config'
import { PrismaService } from './prisma/prisma.service'

async function main() {
   const prisma = new PrismaService()
   try {
      console.log('Seeding lookup tables...')

      // 1. Seed Property Types
      const propertyTypes = [
         { code: 'entire_home', label: 'Entire Home' },
         { code: 'apartment', label: 'Apartment' },
         { code: 'guesthouse', label: 'Guesthouse' },
         { code: 'cabin', label: 'Cabin' },
         { code: 'villa', label: 'Villa' }
      ]

      for (const type of propertyTypes) {
         await prisma.property_types.upsert({
            where: { code: type.code },
            update: {},
            create: type
         })
      }
      console.log('Seeded property types successfully.')

      // 2. Seed Amenities
      const amenities = [
         { code: 'wifi', label: 'Wifi', category: 'basic' },
         { code: 'kitchen', label: 'Kitchen', category: 'basic' },
         { code: 'air_conditioning', label: 'Air Conditioning', category: 'comfort' },
         { code: 'pool', label: 'Swimming Pool', category: 'luxury' },
         { code: 'parking', label: 'Free Parking', category: 'basic' }
      ]

      for (const amenity of amenities) {
         await prisma.amenities.upsert({
            where: { code: amenity.code },
            update: {},
            create: amenity
         })
      }
      console.log('Seeded amenities successfully.')
   } catch (err) {
      console.error('Error seeding:', err)
   } finally {
      await prisma.$disconnect()
   }
}

main().catch(console.error)
