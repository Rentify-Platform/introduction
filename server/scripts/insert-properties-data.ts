import 'dotenv/config'
import { PrismaClient, room_type, property_status, booking_status, review_type } from '@prisma/client'

const prisma = new PrismaClient()

// User Accounts from server/AGENTS.md
const HOST_ID = 'd0c2980e-3995-4fee-9b0e-bbadc3651c06'
const GUEST_ID = '7c123f66-a264-4ec8-b010-09350fbcc27c'
const ADMIN_ID = '17651dbc-5b33-49f0-9cbf-ce70f560f0c0'

async function main() {
   try {
      console.log('Starting full properties data seed...')

      // 1. Ensure Host and Guest accounts exist in database
      console.log('Ensuring user accounts exist...')
      await prisma.accounts.upsert({
         where: { id: HOST_ID },
         update: {},
         create: {
            id: HOST_ID,
            email: 'host@rentify.com',
            role: 'host',
            status: 'active'
         }
      })

      await prisma.accounts.upsert({
         where: { id: GUEST_ID },
         update: {},
         create: {
            id: GUEST_ID,
            email: 'guest@rentify.com',
            role: 'guest',
            status: 'active'
         }
      })

      // 2. Ensure Profiles exist for guest and host
      console.log('Ensuring user profiles exist...')
      await prisma.profiles.upsert({
         where: { account_id: HOST_ID },
         update: {},
         create: {
            account_id: HOST_ID,
            first_name: 'Wayan',
            last_name: 'Suardana',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            bio: 'Local host passionate about eco-friendly bamboo architecture.'
         }
      })

      await prisma.profiles.upsert({
         where: { account_id: GUEST_ID },
         update: {},
         create: {
            account_id: GUEST_ID,
            first_name: 'Sarah',
            last_name: 'Jenkins',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            bio: 'Avid traveler and architectural photographer.'
         }
      })

      // 3. Clear existing transaction and listing data
      console.log('Cleaning up old transactions, reviews, bookings, and properties...')
      await prisma.reviews.deleteMany({})
      await prisma.bookings.deleteMany({})
      await prisma.property_calendar.deleteMany({})
      await prisma.property_photos.deleteMany({})
      await prisma.property_amenities.deleteMany({})
      await prisma.property_licenses.deleteMany({})
      await prisma.wishlist_items.deleteMany({})
      await prisma.properties.deleteMany({})

      // 4. Fetch lookup data
      const typeEntireHome = await prisma.property_types.findUnique({ where: { code: 'entire_home' } })
      const typeCabin = await prisma.property_types.findUnique({ where: { code: 'cabin' } })
      const typeVilla = await prisma.property_types.findUnique({ where: { code: 'villa' } })
      const typeApartment = await prisma.property_types.findUnique({ where: { code: 'apartment' } })

      if (!typeEntireHome || !typeCabin || !typeVilla || !typeApartment) {
         throw new Error('Required property types lookup not found. Run "npx prisma db seed" first.')
      }

      const wifi = await prisma.amenities.findUnique({ where: { code: 'wifi' } })
      const kitchen = await prisma.amenities.findUnique({ where: { code: 'kitchen' } })
      const ac = await prisma.amenities.findUnique({ where: { code: 'air_conditioning' } })
      const pool = await prisma.amenities.findUnique({ where: { code: 'pool' } })
      const parking = await prisma.amenities.findUnique({ where: { code: 'parking' } })

      if (!wifi || !kitchen || !ac || !pool || !parking) {
         throw new Error('Required amenities lookup not found. Run "npx prisma db seed" first.')
      }

      // 5. Define rich listings properties
      const propertiesData = [
         {
            title: 'Tranquil Ubud Treehouse with Valley Views',
            description: 'Escape to a realm of unparalleled tranquility in our exclusive bamboo treehouse. Suspended high above the jungle floor, this architectural marvel offers panoramic views of the surrounding valley, blending luxury with a profound connection to nature. Wake up to the gentle sounds of the forest, enjoy your morning coffee on the expansive deck, and unwind in the natural stone tub as the sun sets over the canopy.',
            room_type: room_type.entire_place,
            property_type_id: typeCabin.id,
            base_price_cents: BigInt(35000), // $350
            cleaning_fee_cents: BigInt(5000), // $50
            city: 'Ubud',
            state_province: 'Bali',
            country_code: 'ID',
            address_line1: 'Jalan Raya Tegallalang',
            latitude: -8.455,
            longitude: 115.28,
            max_guests: 2,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1.0,
            photos: [
               'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
               'https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'
            ],
            amenities: [wifi, kitchen, pool, ac]
         },
         {
            title: 'Modern Malibu Oceanfront Villa',
            description: 'Perched directly above the sandy beach of Malibu, this architectural masterpiece features floor-to-ceiling glass doors opening to a massive deck and infinity pool. Enjoy endless Pacific Ocean vistas, sleek minimalist design, high-end kitchen, private steps down to the beach, and state-of-the-art automation. Perfect for families looking for an unforgettable oceanside escape.',
            room_type: room_type.entire_place,
            property_type_id: typeVilla.id,
            base_price_cents: BigInt(120000), // $1200
            cleaning_fee_cents: BigInt(15000), // $150
            city: 'Malibu',
            state_province: 'California',
            country_code: 'US',
            address_line1: '23400 Pacific Coast Hwy',
            latitude: 34.025,
            longitude: -118.78,
            max_guests: 6,
            bedrooms: 3,
            beds: 4,
            bathrooms: 3.0,
            photos: [
               'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
               'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'
            ],
            amenities: [wifi, kitchen, pool, ac, parking]
         },
         {
            title: 'Cozy A-Frame Forest Cabin',
            description: 'Nestled among towering pine trees, this cozy A-Frame cabin offers the ultimate alpine mountain retreat. Relax in front of the warm stone fireplace, enjoy the spacious outdoor deck, soak in the private hot tub under the stars, or head out to nearby ski lifts and hiking trails just minutes away. The cabin retains historic design details while boasting fully updated amenities.',
            room_type: room_type.entire_place,
            property_type_id: typeCabin.id,
            base_price_cents: BigInt(25000), // $250
            cleaning_fee_cents: BigInt(8000), // $80
            city: 'Lake Tahoe',
            state_province: 'Nevada',
            country_code: 'US',
            address_line1: '560 Fairview Blvd',
            latitude: 39.22,
            longitude: -119.95,
            max_guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 1.5,
            photos: [
               'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
               'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1472214222541-d510753a4707?auto=format&fit=crop&w=600&q=80'
            ],
            amenities: [wifi, kitchen, parking]
         },
         {
            title: 'Sleek Shibuya Skyline Penthouse',
            description: 'Experience Tokyo like never before in this state-of-the-art skyline penthouse. Centrally located in the heart of Shibuya, this luxury loft features Japanese designer minimalist furniture, smart-home automated systems, private laundry facilities, and a stunning outdoor rooftop terrace with 360-degree views of the sprawling metropolis.',
            room_type: room_type.entire_place,
            property_type_id: typeApartment.id,
            base_price_cents: BigInt(40000), // $400
            cleaning_fee_cents: BigInt(6000), // $60
            city: 'Tokyo',
            state_province: 'Tokyo',
            country_code: 'JP',
            address_line1: '1-20 Shibuya',
            latitude: 35.658,
            longitude: 139.7,
            max_guests: 3,
            bedrooms: 1,
            beds: 2,
            bathrooms: 1.0,
            photos: [
               'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
               'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
            ],
            amenities: [wifi, kitchen, ac]
         },
         {
            title: 'Historic Edinburgh Castle-Side Suite',
            description: 'Live like royalty in this beautifully restored historic stone suite, located right next to Edinburgh Castle. Featuring hand-carved stone fireplaces, grand high ceilings, and antique velvet furniture, this apartment perfectly blends rich medieval character with modern luxury bedding, hot shower, and super-fast internet.',
            room_type: room_type.entire_place,
            property_type_id: typeEntireHome.id,
            base_price_cents: BigInt(30000), // $300
            cleaning_fee_cents: BigInt(7000), // $70
            city: 'Edinburgh',
            state_province: 'Scotland',
            country_code: 'GB',
            address_line1: 'Castle Terrace',
            latitude: 55.948,
            longitude: -3.2,
            max_guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 2.0,
            photos: [
               'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=800&q=80',
               'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80',
               'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80'
            ],
            amenities: [wifi, parking]
         }
      ]

      // 6. Create properties, photos, amenities, bookings, and reviews in loops
      for (const p of propertiesData) {
         console.log(`Creating property: "${p.title}"...`)

         const property = await prisma.properties.create({
            data: {
               host_id: HOST_ID,
               property_type_id: p.property_type_id,
               room_type: p.room_type,
               status: property_status.active,
               title: p.title,
               description: p.description,
               address_line1: p.address_line1,
               city: p.city,
               state_province: p.state_province,
               country_code: p.country_code,
               latitude: p.latitude,
               longitude: p.longitude,
               max_guests: p.max_guests,
               bedrooms: p.bedrooms,
               beds: p.beds,
               bathrooms: p.bathrooms,
               base_price_cents: p.base_price_cents,
               cleaning_fee_cents: p.cleaning_fee_cents,
               currency: 'USD', // USD for dollar figures
               published_at: new Date()
            }
         })

         // Create Photos
         for (let i = 0; i < p.photos.length; i++) {
            await prisma.property_photos.create({
               data: {
                  property_id: property.id,
                  url: p.photos[i],
                  position: i,
                  caption: `Beautiful photo ${i + 1} of ${p.title}`
               }
            })
         }

         // Create Amenities links
         for (const amenity of p.amenities) {
            await prisma.property_amenities.create({
               data: {
                  property_id: property.id,
                  amenity_id: amenity.id
               }
            })
         }

         // 7. Create Mock Bookings & Reviews for this property
         console.log(`Creating bookings and reviews for "${p.title}"...`)

         // Booking 1
         const booking1 = await prisma.bookings.create({
            data: {
               property_id: property.id,
               guest_id: GUEST_ID,
               host_id: HOST_ID,
               status: booking_status.completed,
               check_in: new Date('2026-06-01'),
               check_out: new Date('2026-06-05'),
               guests_count: 2,
               nightly_rate_cents: p.base_price_cents,
               cleaning_fee_cents: p.cleaning_fee_cents,
               total_price_cents: p.base_price_cents * BigInt(4) + p.cleaning_fee_cents,
               currency: 'USD',
               cancellation_policy_code: 'moderate'
            }
         })

         // Review 1
         await prisma.reviews.create({
            data: {
               booking_id: booking1.id,
               type: review_type.guest_to_host,
               author_id: GUEST_ID,
               target_id: HOST_ID,
               rating: 5,
               comment: 'This stay was absolute perfection! The design is stunning, every detail is well-thought-out, and the views are breathtaking. Sarah was an amazing host and very responsive. Will definitely book again!',
               host_response: 'Thank you Sarah! It was an absolute pleasure hosting you and we hope to welcome you back soon!'
            }
         })

         // Booking 2
         const booking2 = await prisma.bookings.create({
            data: {
               property_id: property.id,
               guest_id: GUEST_ID,
               host_id: HOST_ID,
               status: booking_status.completed,
               check_in: new Date('2026-06-12'),
               check_out: new Date('2026-06-15'),
               guests_count: 2,
               nightly_rate_cents: p.base_price_cents,
               cleaning_fee_cents: p.cleaning_fee_cents,
               total_price_cents: p.base_price_cents * BigInt(3) + p.cleaning_fee_cents,
               currency: 'USD',
               cancellation_policy_code: 'moderate'
            }
         })

         // Review 2
         await prisma.reviews.create({
            data: {
               booking_id: booking2.id,
               type: review_type.guest_to_host,
               author_id: GUEST_ID,
               target_id: HOST_ID,
               rating: 4,
               comment: 'Super comfortable bed, beautiful environment, and very clean space. The location is peaceful yet close enough to key spots. Highly recommend for a short trip!',
               host_response: 'Glad you had a comfortable stay! Thank you for the kind review.'
            }
         })
      }

      console.log('Seeded properties, photos, amenities, bookings, and reviews successfully!')
   } catch (err) {
      console.error('Seeding error:', err)
   } finally {
      await prisma.$disconnect()
   }
}

main().catch(console.error)
