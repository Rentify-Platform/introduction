require('dotenv').config()
const { Pool } = require('pg')
const { Meilisearch } = require('meilisearch')

const pool = new Pool({
   connectionString: process.env.DATABASE_URL
})

const client = new Meilisearch({
   host: 'http://localhost:7700',
   apiKey: 'rentify_master_key_123456'
})

async function main() {
   const db = await pool.connect()
   try {
      console.log('Fetching properties from database to sync to Meilisearch...')

      const { rows: properties } = await db.query(`
         SELECT p.*, pt.label as property_type_label,
                json_agg(DISTINCT jsonb_build_object('id', a.id, 'label', a.label)) FILTER (WHERE a.id IS NOT NULL) as amenities,
                json_agg(DISTINCT jsonb_build_object('url', ph.url, 'position', ph.position)) FILTER (WHERE ph.id IS NOT NULL) as photos,
                prof.first_name, prof.last_name, prof.avatar_url
         FROM properties p
         JOIN property_types pt ON p.property_type_id = pt.id
         LEFT JOIN property_amenities pa ON p.id = pa.property_id
         LEFT JOIN amenities a ON pa.amenity_id = a.id
         LEFT JOIN property_photos ph ON p.id = ph.property_id
         LEFT JOIN accounts acc ON p.host_id = acc.id
         LEFT JOIN profiles prof ON acc.id = prof.account_id
         WHERE p.status = 'active' AND p.deleted_at IS NULL
         GROUP BY p.id, pt.label, prof.first_name, prof.last_name, prof.avatar_url
      `)

      console.log(`Retrieved ${properties.length} active properties. Syncing to Meilisearch...`)

      const index = client.index('properties')

      // Set settings
      await index.updateSettings({
         filterableAttributes: [
            'status',
            'room_type',
            'property_type',
            'city',
            'price_cents',
            'max_guests',
            'bedrooms',
            'beds',
            'amenities',
            '_geo'
         ],
         sortableAttributes: ['price_cents', 'created_at'],
         searchableAttributes: ['title', 'description', 'city', 'address']
      })

      // Clear index
      await index.deleteAllDocuments()

      if (properties.length > 0) {
         const meiliDocuments = properties.map((p) => {
            const rawAmenities = p.amenities || []
            const rawPhotos = p.photos || []

            // Sort photos by position
            const sortedPhotos = [...rawPhotos].sort((x, y) => x.position - y.position)

            return {
               id: p.id,
               title: p.title,
               description: p.description,
               status: p.status,
               room_type: p.room_type,
               property_type: p.property_type_label,
               city: p.city,
               address: `${p.address_line1}, ${p.city}`,
               price_cents: Number(p.base_price_cents),
               max_guests: p.max_guests,
               bedrooms: p.bedrooms,
               beds: p.beds,
               bathrooms: Number(p.bathrooms),
               amenities: rawAmenities.map((a) => a.label),
               photos: sortedPhotos.map((photo) => photo.url),
               host: {
                  id: p.host_id,
                  name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                  avatar: p.avatar_url
               },
               _geo: {
                  lat: Number(p.latitude),
                  lng: Number(p.longitude)
               },
               created_at: new Date(p.created_at).getTime()
            }
         })

         const task = await index.addDocuments(meiliDocuments)
         console.log('Meilisearch indexing task submitted:', task)
      }

      console.log('Meilisearch sync complete!')
   } catch (err) {
      console.error('Meilisearch sync failed:', err)
   } finally {
      db.release()
      await pool.end()
   }
}

main().catch(console.error)
