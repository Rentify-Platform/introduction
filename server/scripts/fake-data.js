require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')
const crypto = require('crypto')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ---------- fixed UUIDs ----------
const ADMIN_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const HOST_ID = 'd0c2980e-3995-4fee-9b0e-bbadc3651c06' // existing host (Wayan)
const GUEST_ID = '7c123f66-a264-4ec8-b010-09350fbcc27c' // existing guest (Sarah)

// new hosts
const HOSTS = [
   { id: '11111111-2222-3333-4444-55555555aaaa', email: 'minh.nguyen@rentify.com', first: 'Minh', last: 'Nguyen', kyc: 'verified', superhost: true, rr: 98 },
   { id: '11111111-2222-3333-4444-55555555bbbb', email: 'thi.tran@rentify.com', first: 'Thi', last: 'Tran', kyc: 'verified', superhost: false, rr: 84 },
   { id: '11111111-2222-3333-4444-55555555cccc', email: 'quoc.pham@rentify.com', first: 'Quoc', last: 'Pham', kyc: 'verified', superhost: false, rr: 85 }
]

// new guests
const GUESTS = [
   { id: '22222222-3333-4444-5555-66666666aaaa', email: 'linh.vo@rentify.com', first: 'Linh', last: 'Vo', kyc: 'verified' },
   { id: '22222222-3333-4444-5555-66666666bbbb', email: 'john.smith@rentify.com', first: 'John', last: 'Smith', kyc: 'verified' },
   { id: '22222222-3333-4444-5555-66666666cccc', email: 'emma.brown@rentify.com', first: 'Emma', last: 'Brown', kyc: 'verified' },
   { id: '22222222-3333-4444-5555-66666666dddd', email: 'kenji.tanaka@rentify.com', first: 'Kenji', last: 'Tanaka', kyc: 'verified' },
   { id: '22222222-3333-4444-5555-66666666eeee', email: 'maria.garcia@rentify.com', first: 'Maria', last: 'Garcia', kyc: 'verified' },
   { id: '22222222-3333-4444-5555-66666666ffff', email: 'david.miller@rentify.com', first: 'David', last: 'Miller', kyc: 'verified' }
]

const PASSWORD_HASH = '$2b$10$5RxdyZnVxdYusw2zUs8EGe2tUXiqKn777SsC27gvFc.QxsBEoieq.'

// ---------- existing properties (USD) ----------
const EXISTING_PROPERTIES = [
   {
      id: 'e5c4b0da-08b9-41c7-b239-e05ede3300ac',
      host: HOST_ID,
      t: 4, // cabin
      room_type: 'entire_place',
      title: 'Tranquil Ubud Treehouse with Valley Views',
      description: 'Escape to a realm of unparalleled tranquility in our exclusive bamboo treehouse.',
      city: 'Ubud', state: 'Bali', country: 'ID', lat: -8.455, lng: 115.28,
      maxGuests: 2, br: 1, beds: 1, baths: 1.0, price: 35000, clean: 5000, policy: 'moderate', status: 'active', currency: 'USD', addr: 'Jalan Raya Tegallalang'
   },
   {
      id: 'a0c4b0da-08b9-41c7-b239-e05ede3300ab',
      host: HOST_ID,
      t: 5, // villa
      room_type: 'entire_place',
      title: 'Modern Malibu Oceanfront Villa',
      description: 'Perched directly above the sandy beach of Malibu.',
      city: 'Malibu', state: 'California', country: 'US', lat: 34.025, lng: -118.78,
      maxGuests: 6, br: 3, beds: 4, baths: 3.0, price: 120000, clean: 15000, policy: 'moderate', status: 'active', currency: 'USD', addr: '23400 Pacific Coast Hwy'
   },
   {
      id: 'b0c4b0da-08b9-41c7-b239-e05ede3300ac',
      host: HOST_ID,
      t: 4, // cabin
      room_type: 'entire_place',
      title: 'Cozy A-Frame Forest Cabin',
      description: 'Nestled among towering pine trees.',
      city: 'Lake Tahoe', state: 'Nevada', country: 'US', lat: 39.22, lng: -119.95,
      maxGuests: 4, br: 2, beds: 2, baths: 1.5, price: 25000, clean: 8000, policy: 'moderate', status: 'active', currency: 'USD', addr: '560 Fairview Blvd'
   },
   {
      id: 'c0c4b0da-08b9-41c7-b239-e05ede3300ad',
      host: HOST_ID,
      t: 2, // apartment
      room_type: 'entire_place',
      title: 'Sleek Shibuya Skyline Penthouse',
      description: 'Experience Tokyo like never before.',
      city: 'Tokyo', state: 'Tokyo', country: 'JP', lat: 35.658, lng: 139.7,
      maxGuests: 3, br: 1, beds: 2, baths: 1.0, price: 40000, clean: 6000, policy: 'firm', status: 'active', currency: 'USD', addr: '1-20 Shibuya'
   },
   {
      id: 'd0c4b0da-08b9-41c7-b239-e05ede3300ae',
      host: HOST_ID,
      t: 1, // entire_home
      room_type: 'entire_place',
      title: 'Historic Edinburgh Castle-Side Suite',
      description: 'Live like royalty in this beautifully restored historic stone suite.',
      city: 'Edinburgh', state: 'Scotland', country: 'GB', lat: 55.948, lng: -3.2,
      maxGuests: 4, br: 2, beds: 2, baths: 2.0, price: 30000, clean: 7000, policy: 'firm', status: 'active', currency: 'USD', addr: 'Castle Terrace'
   }
]

// ---------- new properties (VND) ----------
const NEW_PROPERTIES = [
   { id: 'a0000000-0000-4000-8000-000000000001', host: HOSTS[0].id, t: 2, room_type: 'entire_place', title: 'Skyline Apartment View Landmark 81', city: 'Ho Chi Minh City', state: 'Ho Chi Minh', country: 'VN', lat: 10.7898, lng: 106.7102, maxGuests: 4, br: 2, beds: 2, baths: 1.5, price: 900000, clean: 150000, policy: 'firm', status: 'active', currency: 'VND', addr: '100 Nguyen Hue' },
   { id: 'a0000000-0000-4000-8000-000000000002', host: HOSTS[0].id, t: 5, room_type: 'entire_place', title: 'Beachfront Villa Nha Trang', city: 'Nha Trang', state: 'Khanh Hoa', country: 'VN', lat: 12.2388, lng: 109.1967, maxGuests: 8, br: 4, beds: 5, baths: 3, price: 2500000, clean: 350000, policy: 'moderate', status: 'active', currency: 'VND', addr: '12 Tran Phu' },
   { id: 'a0000000-0000-4000-8000-000000000003', host: HOSTS[1].id, t: 4, room_type: 'entire_place', title: 'Wooden Cabin Sa Pa', city: 'Sa Pa', state: 'Lao Cai', country: 'VN', lat: 22.3356, lng: 103.8416, maxGuests: 6, br: 3, beds: 3, baths: 2, price: 700000, clean: 120000, policy: 'flexible', status: 'active', currency: 'VND', addr: 'Xa San' },
   { id: 'a0000000-0000-4000-8000-000000000004', host: HOSTS[1].id, t: 3, room_type: 'entire_place', title: 'Cozy Guesthouse Old Quarter', city: 'Hanoi', state: 'Hanoi', country: 'VN', lat: 21.0278, lng: 105.8342, maxGuests: 4, br: 2, beds: 2, baths: 1, price: 500000, clean: 80000, policy: 'flexible', status: 'active', currency: 'VND', addr: '5 Hang Bac' },
   { id: 'a0000000-0000-4000-8000-000000000005', host: HOSTS[2].id, t: 2, room_type: 'entire_place', title: 'Riverside Apartment Da Nang', city: 'Da Nang', state: 'Da Nang', country: 'VN', lat: 16.0544, lng: 108.2022, maxGuests: 5, br: 2, beds: 2, baths: 2, price: 850000, clean: 150000, policy: 'moderate', status: 'draft', currency: 'VND', addr: '20 Bach Dang' },
   { id: 'a0000000-0000-4000-8000-000000000006', host: HOSTS[2].id, t: 5, room_type: 'entire_place', title: 'Luxury Pool Villa Phu Quoc', city: 'Phu Quoc', state: 'Kien Giang', country: 'VN', lat: 10.2899, lng: 103.984, maxGuests: 10, br: 5, beds: 6, baths: 4, price: 3500000, clean: 500000, policy: 'firm', status: 'active', currency: 'VND', addr: 'Bai Khem' }
]

const ALL_PROPERTIES = [...EXISTING_PROPERTIES, ...NEW_PROPERTIES]

function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d }
function fmtDate(d) { return d.toISOString().slice(0, 10) }

function B({ pid, hostId, guestId, status, from, to, guests, nightly, clean, policy, servicePct, currency }) {
   const base = new Date('2026-05-01T00:00:00Z')
   const cin = addDays(base, from)
   const cout = addDays(base, to)
   const nights = to - from
   const subtotal = nightly * nights + clean
   const sfee = Math.round(subtotal * servicePct / 100)
   const taxes = Math.round(subtotal * 0.08)
   const total = subtotal + sfee + taxes
   return {
      pid, hostId, guestId, status, cin: fmtDate(cin), cout: fmtDate(cout),
      guests, nightly, clean, sfee, taxes, total, policy, currency
   }
}

const bookingsList = []

// Existing property bookings (USD)
bookingsList.push(B({ pid: EXISTING_PROPERTIES[0].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 30, to: 34, guests: 2, nightly: 35000, clean: 5000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[0].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 42, to: 45, guests: 2, nightly: 35000, clean: 5000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[0].id, hostId: HOST_ID, guestId: GUESTS[1].id, status: 'cancelled_by_guest', from: 95, to: 100, guests: 2, nightly: 35000, clean: 5000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[0].id, hostId: HOST_ID, guestId: GUESTS[0].id, status: 'pending', from: 190, to: 195, guests: 2, nightly: 35000, clean: 5000, policy: 'moderate', servicePct: 12, currency: 'USD' }))

bookingsList.push(B({ pid: EXISTING_PROPERTIES[1].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 30, to: 34, guests: 4, nightly: 120000, clean: 15000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[1].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 42, to: 45, guests: 4, nightly: 120000, clean: 15000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[1].id, hostId: HOST_ID, guestId: GUESTS[2].id, status: 'pending_approval', from: 92, to: 96, guests: 4, nightly: 120000, clean: 15000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[1].id, hostId: HOST_ID, guestId: GUESTS[3].id, status: 'completed', from: 61, to: 66, guests: 4, nightly: 120000, clean: 15000, policy: 'moderate', servicePct: 12, currency: 'USD' }))

bookingsList.push(B({ pid: EXISTING_PROPERTIES[2].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 30, to: 34, guests: 3, nightly: 25000, clean: 8000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[2].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 42, to: 45, guests: 3, nightly: 25000, clean: 8000, policy: 'moderate', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[2].id, hostId: HOST_ID, guestId: GUESTS[5].id, status: 'cancelled_by_host', from: 80, to: 83, guests: 3, nightly: 25000, clean: 8000, policy: 'moderate', servicePct: 12, currency: 'USD' }))

bookingsList.push(B({ pid: EXISTING_PROPERTIES[3].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 30, to: 34, guests: 2, nightly: 40000, clean: 6000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[3].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 42, to: 45, guests: 2, nightly: 40000, clean: 6000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[3].id, hostId: HOST_ID, guestId: GUESTS[4].id, status: 'confirmed', from: 200, to: 205, guests: 3, nightly: 40000, clean: 6000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[3].id, hostId: HOST_ID, guestId: GUESTS[0].id, status: 'pending', from: 250, to: 254, guests: 2, nightly: 40000, clean: 6000, policy: 'firm', servicePct: 12, currency: 'USD' }))

bookingsList.push(B({ pid: EXISTING_PROPERTIES[4].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 30, to: 34, guests: 3, nightly: 30000, clean: 7000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[4].id, hostId: HOST_ID, guestId: GUEST_ID, status: 'completed', from: 42, to: 45, guests: 3, nightly: 30000, clean: 7000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[4].id, hostId: HOST_ID, guestId: GUESTS[1].id, status: 'expired', from: 65, to: 68, guests: 3, nightly: 30000, clean: 7000, policy: 'firm', servicePct: 12, currency: 'USD' }))
bookingsList.push(B({ pid: EXISTING_PROPERTIES[4].id, hostId: HOST_ID, guestId: GUESTS[2].id, status: 'pending_approval', from: 210, to: 214, guests: 3, nightly: 30000, clean: 7000, policy: 'firm', servicePct: 12, currency: 'USD' }))

// New properties bookings (VND)
bookingsList.push(B({ pid: NEW_PROPERTIES[0].id, hostId: HOSTS[0].id, guestId: GUESTS[0].id, status: 'pending_approval', from: 95, to: 99, guests: 3, nightly: 900000, clean: 150000, policy: 'firm', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[0].id, hostId: HOSTS[0].id, guestId: GUESTS[3].id, status: 'completed', from: 60, to: 64, guests: 4, nightly: 900000, clean: 150000, policy: 'firm', servicePct: 12, currency: 'VND' }))

bookingsList.push(B({ pid: NEW_PROPERTIES[1].id, hostId: HOSTS[0].id, guestId: GUESTS[5].id, status: 'confirmed', from: 190, to: 197, guests: 6, nightly: 2500000, clean: 350000, policy: 'moderate', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[1].id, hostId: HOSTS[0].id, guestId: GUESTS[1].id, status: 'cancelled_by_guest', from: 120, to: 125, guests: 5, nightly: 2500000, clean: 350000, policy: 'moderate', servicePct: 12, currency: 'VND' }))

bookingsList.push(B({ pid: NEW_PROPERTIES[2].id, hostId: HOSTS[1].id, guestId: GUESTS[2].id, status: 'completed', from: 53, to: 56, guests: 4, nightly: 700000, clean: 120000, policy: 'flexible', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[2].id, hostId: HOSTS[1].id, guestId: GUESTS[4].id, status: 'pending', from: 185, to: 189, guests: 4, nightly: 700000, clean: 120000, policy: 'flexible', servicePct: 12, currency: 'VND' }))

bookingsList.push(B({ pid: NEW_PROPERTIES[3].id, hostId: HOSTS[1].id, guestId: GUESTS[0].id, status: 'confirmed', from: 180, to: 183, guests: 2, nightly: 500000, clean: 80000, policy: 'flexible', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[4].id, hostId: HOSTS[2].id, guestId: GUESTS[5].id, status: 'pending', from: 90, to: 93, guests: 3, nightly: 850000, clean: 150000, policy: 'moderate', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[4].id, hostId: HOSTS[2].id, guestId: GUESTS[1].id, status: 'completed', from: 55, to: 58, guests: 3, nightly: 850000, clean: 150000, policy: 'moderate', servicePct: 12, currency: 'VND' }))
bookingsList.push(B({ pid: NEW_PROPERTIES[5].id, hostId: HOSTS[2].id, guestId: GUESTS[3].id, status: 'pending_approval', from: 88, to: 93, guests: 8, nightly: 3500000, clean: 500000, policy: 'firm', servicePct: 12, currency: 'VND' }))

async function main() {
   const client = await pool.connect()
   try {
      await client.query('BEGIN')

      // Clean existing ledger & bookings data to avoid unique constraint conflicts
      await client.query("SET session_replication_role = 'replica'");
      await client.query('DELETE FROM kyc_documents')
      await client.query('DELETE FROM kyc_checks')
      await client.query('DELETE FROM cancellations')
      await client.query('DELETE FROM host_penalties')
      await client.query('DELETE FROM payouts')
      await client.query('DELETE FROM ledger_entries')
      await client.query('DELETE FROM ledger_transactions')
      await client.query('DELETE FROM ledger_balances')
      await client.query('DELETE FROM ledger_accounts')
      await client.query('DELETE FROM reviews')
      await client.query('DELETE FROM bookings')
      await client.query("SET session_replication_role = 'origin'");

      // 0. Fix uuidv7 function & seed extensions / lookup tables
      await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)
      await client.query(`CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS 'SELECT gen_random_uuid();' LANGUAGE sql;`)

      await client.query(`
         INSERT INTO property_types (code, label) VALUES
            ('entire_home', 'Entire Home'),
            ('apartment', 'Apartment'),
            ('guesthouse', 'Guesthouse'),
            ('cabin', 'Cabin'),
            ('villa', 'Villa')
         ON CONFLICT (code) DO NOTHING
      `)

      await client.query(`
         INSERT INTO amenities (code, label, category) VALUES
            ('wifi', 'Wifi', 'basic'),
            ('kitchen', 'Kitchen', 'basic'),
            ('air_conditioning', 'Air Conditioning', 'comfort'),
            ('pool', 'Swimming Pool', 'luxury'),
            ('parking', 'Free Parking', 'basic')
         ON CONFLICT (code) DO NOTHING
      `)

      // 1. Admin, Wayan (host), Sarah (guest)
      await client.query(`
         INSERT INTO accounts (id, email, role, status, password_hash, created_at, updated_at)
         VALUES 
            ('${HOST_ID}', 'host@rentify.com', 'host', 'active', '${PASSWORD_HASH}', NOW(), NOW()),
            ('${GUEST_ID}', 'guest@rentify.com', 'guest', 'active', '${PASSWORD_HASH}', NOW(), NOW()),
            ('${ADMIN_ID}', 'admin@rentify.com', 'admin', 'active', '${PASSWORD_HASH}', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING
      `)

      await client.query(`
         INSERT INTO profiles (account_id, first_name, last_name, avatar_url, bio, created_at, updated_at)
         VALUES 
            ('${HOST_ID}', 'Wayan', 'Suardana', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'Local host passionate about eco-friendly bamboo architecture.', NOW(), NOW()),
            ('${GUEST_ID}', 'Sarah', 'Jenkins', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', 'Avid traveler and architectural photographer.', NOW(), NOW()),
            ('${ADMIN_ID}', 'System', 'Admin', null, 'Platform administrator', NOW(), NOW())
         ON CONFLICT (account_id) DO NOTHING
      `)

      await client.query(`
         INSERT INTO host_profiles (account_id, is_superhost, kyc_status, tax_verified, payout_account_verified, created_at, updated_at)
         VALUES 
            ('${HOST_ID}', true, 'verified', true, true, NOW(), NOW())
         ON CONFLICT (account_id) DO UPDATE SET tax_verified = TRUE, payout_account_verified = TRUE
      `)

      // 2. New hosts & guests
      for (const h of HOSTS) {
         await client.query(`INSERT INTO accounts (id, email, role, status, password_hash, email_verified_at, phone)
            VALUES ($1,$2,'host','active',$3,NOW(),NULL) ON CONFLICT (id) DO NOTHING`, [h.id, h.email, PASSWORD_HASH])
         await client.query(`INSERT INTO profiles (account_id, first_name, last_name, guest_kyc_status, bio)
            VALUES ($1,$2,$3,'verified',$4) ON CONFLICT (account_id) DO NOTHING`, [h.id, h.first, h.last, 'Host on Rentify.'])
         await client.query(`INSERT INTO host_profiles (account_id, about, is_superhost, response_rate_pct, kyc_status, tax_verified, payout_account_verified, became_host_at)
            VALUES ($1,$2,$3,$4,$5,TRUE,TRUE,NOW()) ON CONFLICT (account_id) DO UPDATE SET tax_verified = TRUE, payout_account_verified = TRUE`,
            [h.id, 'Friendly host', h.superhost, h.rr, h.kyc])
      }

      for (const g of GUESTS) {
         await client.query(`INSERT INTO accounts (id, email, role, status, password_hash, email_verified_at, phone)
            VALUES ($1,$2,'guest','active',$3,NOW(),NULL) ON CONFLICT (id) DO NOTHING`, [g.id, g.email, PASSWORD_HASH])
         await client.query(`INSERT INTO profiles (account_id, first_name, last_name, guest_kyc_status, bio)
            VALUES ($1,$2,$3,$4,$5) ON CONFLICT (account_id) DO NOTHING`, [g.id, g.first, g.last, g.kyc, 'Traveler.'])
      }

      // 3. Properties (existing + new)
      for (const p of ALL_PROPERTIES) {
         await client.query(`INSERT INTO properties (id, host_id, property_type_id, room_type, status, title, description, address_line1, city, state_province, country_code, latitude, longitude, max_guests, bedrooms, beds, bathrooms, base_price_cents, cleaning_fee_cents, currency, instant_book, cancellation_policy_code, published_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,FALSE,$21,$22)
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status`,
            [p.id, p.host, p.t, p.room_type, p.status, p.title, p.description || 'A lovely place to stay.', p.addr, p.city, p.state, p.country, p.lat, p.lng, p.maxGuests, p.br, p.beds, p.baths, p.price, p.clean, p.currency, p.policy, p.status === 'active' ? new Date() : null])
         
         // photos
         for (let i = 0; i < 3; i++) {
            await client.query(`INSERT INTO property_photos (id, property_id, url, caption, position)
               VALUES (gen_random_uuid(), $1, $2, $3, $4) ON CONFLICT (property_id, position) DO NOTHING`,
               [p.id, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Photo ' + i, i])
         }
         // amenities
         await client.query(`INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1,1),($1,2),($1,3),($1,4),($1,5) ON CONFLICT DO NOTHING`, [p.id])
      }
      console.log('· properties OK')

      // 4. Ledger Accounts setup
      const currencies = ['USD', 'VND']
      const ledgerAccountMap = new Map()

      for (const curr of currencies) {
         const { rows: r1 } = await client.query(`
            INSERT INTO ledger_accounts (owner_type, owner_account_id, account_subtype, currency)
            VALUES ('platform', NULL, 'escrow', $1)
            ON CONFLICT (owner_type, owner_account_id, account_subtype, currency) 
            DO UPDATE SET currency = EXCLUDED.currency
            RETURNING id
         `, [curr])
         ledgerAccountMap.set(`platform:null:escrow:${curr}`, r1[0].id)

         const { rows: r2 } = await client.query(`
            INSERT INTO ledger_accounts (owner_type, owner_account_id, account_subtype, currency)
            VALUES ('platform', NULL, 'revenue', $1)
            ON CONFLICT (owner_type, owner_account_id, account_subtype, currency) 
            DO UPDATE SET currency = EXCLUDED.currency
            RETURNING id
         `, [curr])
         ledgerAccountMap.set(`platform:null:revenue:${curr}`, r2[0].id)

         const { rows: r3 } = await client.query(`
            INSERT INTO ledger_accounts (owner_type, owner_account_id, account_subtype, currency)
            VALUES ('platform', NULL, 'tax_payable', $1)
            ON CONFLICT (owner_type, owner_account_id, account_subtype, currency) 
            DO UPDATE SET currency = EXCLUDED.currency
            RETURNING id
         `, [curr])
         ledgerAccountMap.set(`platform:null:tax_payable:${curr}`, r3[0].id)

         const { rows: r4 } = await client.query(`
            INSERT INTO ledger_accounts (owner_type, owner_account_id, account_subtype, currency)
            VALUES ('platform', NULL, 'clearing', $1)
            ON CONFLICT (owner_type, owner_account_id, account_subtype, currency) 
            DO UPDATE SET currency = EXCLUDED.currency
            RETURNING id
         `, [curr])
         ledgerAccountMap.set(`platform:null:clearing:${curr}`, r4[0].id)
      }

      const allHosts = [HOST_ID, ...HOSTS.map(h => h.id)]
      for (const hid of allHosts) {
         const prop = ALL_PROPERTIES.find(p => p.host === hid)
         const curr = prop ? prop.currency : 'VND'

         const { rows: rHost } = await client.query(`
            INSERT INTO ledger_accounts (owner_type, owner_account_id, account_subtype, currency)
            VALUES ('host', $1, 'payable', $2)
            ON CONFLICT (owner_type, owner_account_id, account_subtype, currency) 
            DO UPDATE SET currency = EXCLUDED.currency
            RETURNING id
         `, [hid, curr])
         ledgerAccountMap.set(`host:${hid}:payable:${curr}`, rHost[0].id)
      }

      // 5. Bookings & Ledger Transactions / Entries
      for (const b of bookingsList) {
         const bookingId = crypto.randomUUID()
         await client.query(`
            INSERT INTO bookings (
               id, property_id, guest_id, host_id, status, check_in, check_out,
               guests_count, nightly_rate_cents, cleaning_fee_cents, service_fee_cents, taxes_cents,
               total_price_cents, currency, cancellation_policy_code, booked_at, created_at, updated_at
            ) VALUES (
               $1, $2, $3, $4, $5, $6::date, $7::date,
               $8, $9, $10, $11, $12,
               $13, $14, $15, NOW(), NOW(), NOW()
            ) ON CONFLICT DO NOTHING
         `, [
            bookingId, b.pid, b.guestId, b.hostId, b.status, b.cin, b.cout,
            b.guests, b.nightly, b.clean, b.sfee, b.taxes,
            b.total, b.currency, b.policy
         ])

         // If completed, add a review
         if (b.status === 'completed') {
            await client.query(`
               INSERT INTO reviews (
                  id, booking_id, type, author_id, target_id, rating, comment, host_response, created_at
               ) VALUES (
                  gen_random_uuid(), $1, 'guest_to_host', $2, $3, 5,
                  $4, $5, NOW()
               ) ON CONFLICT (booking_id, type) DO NOTHING
            `, [
               bookingId, b.guestId, b.hostId,
               'Wonderful stay! Everything was clean, comfortable, and exactly as described.',
               'Thank you for being a fantastic guest! Welcome back anytime.'
            ])
         }

         // Seed Ledger Transactions for this booking
         const curr = b.currency
         const escrowAccId = ledgerAccountMap.get(`platform:null:escrow:${curr}`)
         const clearingAccId = ledgerAccountMap.get(`platform:null:clearing:${curr}`)
         const revenueAccId = ledgerAccountMap.get(`platform:null:revenue:${curr}`)
         const taxAccId = ledgerAccountMap.get(`platform:null:tax_payable:${curr}`)
         const hostPayableAccId = ledgerAccountMap.get(`host:${b.hostId}:payable:${curr}`)

         if (escrowAccId && clearingAccId && hostPayableAccId) {
            const txn1Id = crypto.randomUUID()
            await client.query(`
               INSERT INTO ledger_transactions (id, idempotency_key, type, booking_id, description, created_at)
               VALUES ($1, $2, 'booking_payment', $3, 'Guest payment into escrow for booking', NOW())
               ON CONFLICT (idempotency_key) DO NOTHING
            `, [txn1Id, crypto.randomUUID(), bookingId])

            await client.query(`
               INSERT INTO ledger_entries (transaction_id, ledger_account_id, amount_cents, currency)
               VALUES 
                  ($1, $2, $3, $4),
                  ($1, $5, $6, $4)
               ON CONFLICT DO NOTHING
            `, [txn1Id, escrowAccId, b.total, curr, clearingAccId, -b.total])

            if (['confirmed', 'completed', 'pending'].includes(b.status)) {
               const txn2Id = crypto.randomUUID()
               await client.query(`
                  INSERT INTO ledger_transactions (id, idempotency_key, type, booking_id, description, created_at)
                  VALUES ($1, $2, 'host_accrual', $3, 'Accrue host earnings and platform service fee', NOW())
                  ON CONFLICT (idempotency_key) DO NOTHING
               `, [txn2Id, crypto.randomUUID(), bookingId])

               const subtotal = b.total - b.sfee - b.taxes
               await client.query(`
                  INSERT INTO ledger_entries (transaction_id, ledger_account_id, amount_cents, currency)
                  VALUES 
                     ($1, $2, $3, $4),
                     ($1, $5, $6, $4),
                     ($1, $7, $8, $4),
                     ($1, $9, $10, $4)
                  ON CONFLICT DO NOTHING
               `, [
                  txn2Id,
                  escrowAccId, -b.total,
                  curr,
                  hostPayableAccId,
                  subtotal,
                  revenueAccId,
                  b.sfee,
                  taxAccId,
                  b.taxes
               ])
            }
         }
      }
      console.log('· bookings, reviews & ledger entries OK')

      // 6. Fake Payouts
      for (const hid of allHosts) {
         const prop = ALL_PROPERTIES.find(p => p.host === hid)
         const curr = prop ? prop.currency : 'VND'
         const clearingAccId = ledgerAccountMap.get(`platform:null:clearing:${curr}`)
         const hostPayableAccId = ledgerAccountMap.get(`host:${hid}:payable:${curr}`)

         if (clearingAccId && hostPayableAccId) {
             const amount = curr === 'USD' ? 50000 : 1000000;
             const txnId = crypto.randomUUID()
             await client.query(`
                INSERT INTO ledger_transactions (id, idempotency_key, type, description, created_at)
                VALUES ($1, $2, 'payout', 'Weekly host payout', NOW())
             `, [txnId, crypto.randomUUID()])

             await client.query(`
                INSERT INTO ledger_entries (transaction_id, ledger_account_id, amount_cents, currency)
                VALUES 
                   ($1, $2, $3, $4),
                   ($1, $5, $6, $4)
             `, [txnId, hostPayableAccId, -amount, curr, clearingAccId, amount])

             await client.query(`
                INSERT INTO payouts (id, host_id, ledger_transaction_id, amount_cents, currency, status, scheduled_for, paid_at, created_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, 'paid', NOW(), NOW(), NOW())
             `, [hid, txnId, amount, curr])
         }
      }
      console.log('· payouts OK')

      // 7. Fake Host Penalties
      let penaltyCount = 1;
      for (const hid of allHosts) {
         const amount = 50000 * penaltyCount; // Just some varying amount
         await client.query(`
            INSERT INTO host_penalties (id, host_id, penalty_type, amount_cents, notes, created_at)
            VALUES (gen_random_uuid(), $1, 'host_cancellation', $2, 'Cancelled booking at the last minute', NOW())
         `, [hid, amount])
         penaltyCount++;
      }
      console.log('· host penalties OK')

      // 8. Fake KYC Queue
      for (let i = 0; i < 3; i++) {
         const h = HOSTS[i]
         await client.query(`
            INSERT INTO kyc_documents (id, account_id, doc_type, country_code, file_url_front, status, created_at)
            VALUES (gen_random_uuid(), $1, 'passport', 'VN', 'https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&w=600&q=80', 'pending', NOW())
         `, [h.id])
      }
      console.log('· kyc queue OK')

      // 9. Fake Cancellations
      const { rows: cancelledBookings } = await client.query(`SELECT id, guest_id, host_id, status, total_price_cents FROM bookings WHERE status IN ('cancelled_by_guest', 'cancelled_by_host')`)
      for (const cb of cancelledBookings) {
         const role = cb.status === 'cancelled_by_guest' ? 'guest' : 'host'
         const canceledBy = role === 'guest' ? cb.guest_id : cb.host_id
         const refund = role === 'host' ? cb.total_price_cents : 10000;
         await client.query(`
            INSERT INTO cancellations (id, booking_id, cancelled_by_account_id, cancelled_by_role, reason_text, days_before_checkin, applied_policy_code, guest_refund_cents, host_payout_cents, platform_fee_kept_cents, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, 'Change of plans', 5, 'moderate', $4, 0, 0, NOW())
         `, [cb.id, canceledBy, role, refund])
      }
      console.log('· cancellations OK')

      await client.query('COMMIT')
      console.log('DONE seeding all accounts, profiles, properties, bookings, reviews, and ledger transactions successfully!')
   } catch (e) {
      await client.query('ROLLBACK')
      console.error('FAILED:', e)
      process.exitCode = 1
   } finally {
      client.release()
      await pool.end()
   }
}

main()
