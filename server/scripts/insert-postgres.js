require('dotenv').config()
const { Pool } = require('pg')
const crypto = require('crypto')

const pool = new Pool({
   connectionString: process.env.DATABASE_URL
})

const HOST_ID = 'd0c2980e-3995-4fee-9b0e-bbadc3651c06'
const GUEST_ID = '7c123f66-a264-4ec8-b010-09350fbcc27c'

const PROPERTIES = [
   {
      id: 'e5c4b0da-08b9-41c7-b239-e05ede3300ac',
      title: 'Tranquil Ubud Treehouse with Valley Views',
      description: 'Escape to a realm of unparalleled tranquility in our exclusive bamboo treehouse. Suspended high above the jungle floor, this architectural marvel offers panoramic views of the surrounding valley, blending luxury with a profound connection to nature. Wake up to the gentle sounds of the forest, enjoy your morning coffee on the expansive deck, and unwind in the natural stone tub as the sun sets over the canopy.',
      room_type: 'entire_place',
      type_code: 'cabin',
      base_price_cents: 35000,
      cleaning_fee_cents: 5000,
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
      amenity_codes: ['wifi', 'kitchen', 'pool', 'air_conditioning']
   },
   {
      id: 'a0c4b0da-08b9-41c7-b239-e05ede3300ab',
      title: 'Modern Malibu Oceanfront Villa',
      description: 'Perched directly above the sandy beach of Malibu, this architectural masterpiece features floor-to-ceiling glass doors opening to a massive deck and infinity pool. Enjoy endless Pacific Ocean vistas, sleek minimalist design, high-end kitchen, private steps down to the beach, and state-of-the-art automation. Perfect for families looking for an unforgettable oceanside escape.',
      room_type: 'entire_place',
      type_code: 'villa',
      base_price_cents: 120000,
      cleaning_fee_cents: 15000,
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
      amenity_codes: ['wifi', 'kitchen', 'pool', 'air_conditioning', 'parking']
   },
   {
      id: 'b0c4b0da-08b9-41c7-b239-e05ede3300ac',
      title: 'Cozy A-Frame Forest Cabin',
      description: 'Nestled among towering pine trees, this cozy A-Frame cabin offers the ultimate alpine mountain retreat. Relax in front of the warm stone fireplace, enjoy the spacious outdoor deck, soak in the private hot tub under the stars, or head out to nearby ski lifts and hiking trails just minutes away. The cabin retains historic design details while boasting fully updated amenities.',
      room_type: 'entire_place',
      type_code: 'cabin',
      base_price_cents: 25000,
      cleaning_fee_cents: 8000,
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
      amenity_codes: ['wifi', 'kitchen', 'parking']
   },
   {
      id: 'c0c4b0da-08b9-41c7-b239-e05ede3300ad',
      title: 'Sleek Shibuya Skyline Penthouse',
      description: 'Experience Tokyo like never before in this state-of-the-art skyline penthouse. Centrally located in the heart of Shibuya, this luxury loft features Japanese designer minimalist furniture, smart-home automated systems, private laundry facilities, and a stunning outdoor rooftop terrace with 360-degree views of the sprawling metropolis.',
      room_type: 'entire_place',
      type_code: 'apartment',
      base_price_cents: 40000,
      cleaning_fee_cents: 6000,
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
      amenity_codes: ['wifi', 'kitchen', 'air_conditioning']
   },
   {
      id: 'd0c4b0da-08b9-41c7-b239-e05ede3300ae',
      title: 'Historic Edinburgh Castle-Side Suite',
      description: 'Live like royalty in this beautifully restored historic stone suite, located right next to Edinburgh Castle. Featuring hand-carved stone fireplaces, grand high ceilings, and antique velvet furniture, this apartment perfectly blends rich medieval character with modern luxury bedding, hot shower, and super-fast internet.',
      room_type: 'entire_place',
      type_code: 'entire_home',
      base_price_cents: 30000,
      cleaning_fee_cents: 7000,
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
      amenity_codes: ['wifi', 'parking']
   }
]

async function main() {
   const client = await pool.connect()
   try {
      console.log('Beginning transactional direct SQL seed...')
      await client.query('BEGIN')

      // Ensure accounts exist
      await client.query(`
         INSERT INTO accounts (id, email, role, status, created_at, updated_at)
         VALUES 
            ('${HOST_ID}', 'host@rentify.com', 'host', 'active', NOW(), NOW()),
            ('${GUEST_ID}', 'guest@rentify.com', 'guest', 'active', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING
      `)

      // Ensure profiles exist
      await client.query(`
         INSERT INTO profiles (account_id, first_name, last_name, avatar_url, bio, created_at, updated_at)
         VALUES 
            ('${HOST_ID}', 'Wayan', 'Suardana', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'Local host passionate about eco-friendly bamboo architecture.', NOW(), NOW()),
            ('${GUEST_ID}', 'Sarah', 'Jenkins', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', 'Avid traveler and architectural photographer.', NOW(), NOW())
         ON CONFLICT (account_id) DO NOTHING
      `)

      // Cleanup
      console.log('Clearing old transaction logs, reviews, bookings, and listings...')
      await client.query('DELETE FROM reviews')
      await client.query('DELETE FROM bookings')
      await client.query('DELETE FROM property_calendar')
      await client.query('DELETE FROM property_photos')
      await client.query('DELETE FROM property_amenities')
      await client.query('DELETE FROM property_licenses')
      await client.query('DELETE FROM wishlist_items')
      await client.query('DELETE FROM properties')

      // Fetch lookup tables
      const { rows: types } = await client.query('SELECT id, code FROM property_types')
      const { rows: amenities } = await client.query('SELECT id, code FROM amenities')

      const typeMap = new Map(types.map((t) => [t.code, t.id]))
      const amenityMap = new Map(amenities.map((a) => [a.code, a.id]))

      // Insert properties
      for (const p of PROPERTIES) {
         console.log(`Inserting property: "${p.title}"`)
         const typeId = typeMap.get(p.type_code)
         if (!typeId) throw new Error(`Property type "${p.type_code}" not found in lookup tables.`)

         await client.query(`
            INSERT INTO properties (
               id, host_id, property_type_id, room_type, status, title, description, 
               address_line1, city, state_province, country_code, latitude, longitude, 
               max_guests, bedrooms, beds, bathrooms, base_price_cents, cleaning_fee_cents, 
               currency, published_at, created_at, updated_at
            ) VALUES (
               '${p.id}', '${HOST_ID}', ${typeId}, '${p.room_type}', 'active', $1, $2,
               $3, $4, $5, $6, ${p.latitude}, ${p.longitude},
               ${p.max_guests}, ${p.bedrooms}, ${p.beds}, ${p.bathrooms}, ${p.base_price_cents}, ${p.cleaning_fee_cents},
               'USD', NOW(), NOW(), NOW()
            )
         `, [p.title, p.description, p.address_line1, p.city, p.state_province, p.country_code])

         // Insert Photos
         for (let i = 0; i < p.photos.length; i++) {
            await client.query(`
               INSERT INTO property_photos (id, property_id, url, position, caption)
               VALUES (gen_random_uuid(), '${p.id}', '${p.photos[i]}', ${i}, 'Beautiful view of ${p.title.replace(/'/g, "''")}')
            `)
         }

         // Insert Amenities links
         for (const code of p.amenity_codes) {
            const amenityId = amenityMap.get(code)
            if (amenityId) {
               await client.query(`
                  INSERT INTO property_amenities (property_id, amenity_id)
                  VALUES ('${p.id}', ${amenityId})
               `)
            }
         }

         // Insert 2 Bookings and 2 reviews for this property
         console.log(`Adding bookings and reviews for "${p.title}"`)

         // Booking 1
         const booking1Id = crypto.randomUUID()
         await client.query(`
            INSERT INTO bookings (
               id, property_id, guest_id, host_id, status, check_in, check_out, 
               guests_count, nightly_rate_cents, cleaning_fee_cents, total_price_cents, 
               currency, cancellation_policy_code, booked_at, created_at, updated_at
            ) VALUES (
               '${booking1Id}', '${p.id}', '${GUEST_ID}', '${HOST_ID}', 'completed', 
               '2026-06-01'::date, '2026-06-05'::date, 2, ${p.base_price_cents}, ${p.cleaning_fee_cents},
               ${p.base_price_cents * 4 + p.cleaning_fee_cents}, 'USD', 'moderate', NOW(), NOW(), NOW()
            )
         `)

         // Review 1
         await client.query(`
            INSERT INTO reviews (
               id, booking_id, type, author_id, target_id, rating, comment, host_response, created_at
            ) VALUES (
               gen_random_uuid(), '${booking1Id}', 'guest_to_host', '${GUEST_ID}', '${HOST_ID}', 5,
               $1, $2, NOW()
            )
         `, [
            `This stay was absolute perfection! The design is stunning, every detail is well-thought-out, and the views are breathtaking. Wayan was an amazing host and very responsive. Will definitely book again!`,
            `Thank you Sarah! It was an absolute pleasure hosting you and we hope to welcome you back soon!`
         ])

         // Booking 2
         const booking2Id = crypto.randomUUID()
         await client.query(`
            INSERT INTO bookings (
               id, property_id, guest_id, host_id, status, check_in, check_out, 
               guests_count, nightly_rate_cents, cleaning_fee_cents, total_price_cents, 
               currency, cancellation_policy_code, booked_at, created_at, updated_at
            ) VALUES (
               '${booking2Id}', '${p.id}', '${GUEST_ID}', '${HOST_ID}', 'completed', 
               '2026-06-12'::date, '2026-06-15'::date, 2, ${p.base_price_cents}, ${p.cleaning_fee_cents},
               ${p.base_price_cents * 3 + p.cleaning_fee_cents}, 'USD', 'moderate', NOW(), NOW(), NOW()
            )
         `)

         // Review 2
         await client.query(`
            INSERT INTO reviews (
               id, booking_id, type, author_id, target_id, rating, comment, host_response, created_at
            ) VALUES (
               gen_random_uuid(), '${booking2Id}', 'guest_to_host', '${GUEST_ID}', '${HOST_ID}', 4,
               $1, $2, NOW()
            )
         `, [
            `Super comfortable bed, beautiful environment, and very clean space. The location is peaceful yet close enough to key spots. Highly recommend for a short trip!`,
            `Glad you had a comfortable stay! Thank you for the kind review.`
         ])
      }

      await client.query('COMMIT')
      console.log('Direct SQL seeding transaction completed successfully!')
   } catch (err) {
      await client.query('ROLLBACK')
      console.error('Transactional SQL seeding failed. Rolled back.', err)
   } finally {
      client.release()
      await pool.end()
   }
}

main().catch(console.error)
