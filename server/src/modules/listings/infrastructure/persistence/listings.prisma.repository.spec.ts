import { ListingsPrismaRepository } from './listings.prisma.repository'
import { PrismaService } from '../../../../prisma/prisma.service'

// Minimal prisma properties row returned by the mocked interactive transaction
const propertyRecord = (status: string, deletedAt: Date | null) => ({
   id: 'property-123',
   host_id: 'host-123',
   property_type_id: 1,
   room_type: 'entire_place',
   status,
   title: 'Admin managed property',
   description: null,
   address_line1: '123 Main Street',
   address_line2: null,
   city: 'Hanoi',
   state_province: null,
   country_code: 'VN',
   postal_code: null,
   latitude: 21.0285,
   longitude: 105.8542,
   max_guests: 2,
   bedrooms: 1,
   beds: 1,
   bathrooms: 1,
   base_price_cents: 500000n,
   cleaning_fee_cents: 0n,
   currency: 'VND',
   minimum_nights: 1,
   maximum_nights: 365,
   check_in_time: new Date('1970-01-01T15:00:00.000Z'),
   check_out_time: new Date('1970-01-01T11:00:00.000Z'),
   instant_book: false,
   cancellation_policy_code: 'moderate',
   requires_local_license: false,
   created_at: new Date('2026-08-20T00:00:00.000Z'),
   updated_at: new Date('2026-09-01T00:00:00.000Z'),
   published_at: null,
   deleted_at: deletedAt,
   property_amenities: [{ amenity_id: 1, amenities: { id: 1, label: 'Wifi' } }],
   property_photos: [{ url: 'http://photo1.jpg', position: 0 }]
})

type TransactionClient = {
   properties: { update: jest.Mock }
   outbox_events: { create: jest.Mock }
}

describe('ListingsPrismaRepository.updatePropertyStatus', () => {
   let tx: TransactionClient
   let prisma: { $transaction: jest.Mock }
   let repository: ListingsPrismaRepository

   beforeEach(() => {
      tx = {
         properties: { update: jest.fn() },
         outbox_events: { create: jest.fn() }
      }
      prisma = {
         $transaction: jest.fn(
            async (callback: (txClient: TransactionClient) => Promise<unknown>) => {
               return callback(tx)
            }
         )
      }
      repository = new ListingsPrismaRepository(prisma as unknown as PrismaService)
   })

   const expectOutboxEventCreatedWithStatus = (
      expectedStatus: 'active' | 'paused' | 'archived'
   ) => {
      expect(tx.outbox_events.create).toHaveBeenCalledTimes(1)
      expect(tx.outbox_events.create).toHaveBeenCalledWith({
         data: {
            aggregate_type: 'property',
            aggregate_id: 'property-123',
            event_type: 'property.status.changed',
            payload: { status: expectedStatus },
            status: 'pending'
         }
      })
   }

   it.each(['active', 'paused', 'archived'] as const)(
      'creates an outbox event carrying the new status when setting %s',
      async (status) => {
         tx.properties.update.mockResolvedValue(
            propertyRecord(status, status === 'archived' ? new Date() : null)
         )

         const result = await repository.updatePropertyStatus('property-123', status)

         expect(tx.properties.update).toHaveBeenCalledTimes(1)
         expect(tx.properties.update).toHaveBeenCalledWith({
            where: { id: 'property-123' },
            data: {
               status,
               updated_at: expect.any(Date) as Date,
               deleted_at: status === 'archived' ? (expect.any(Date) as Date) : null
            },
            include: {
               property_amenities: { include: { amenities: true } },
               property_photos: { orderBy: { position: 'asc' } }
            }
         })
         expectOutboxEventCreatedWithStatus(status)

         // Both operations must run inside the same interactive transaction
         expect(prisma.$transaction).toHaveBeenCalledTimes(1)
         const updateOrder = tx.properties.update.mock.invocationCallOrder[0]
         const eventOrder = tx.outbox_events.create.mock.invocationCallOrder[0]
         expect(eventOrder).toBeGreaterThan(updateOrder)

         // The returned entity reflects the new persisted state
         expect(result).toBeInstanceOf(Object)
         expect(result.id).toBe('property-123')
         expect(result.status).toBe(status)
         if (status === 'archived') {
            expect(result.deletedAt).toBeInstanceOf(Date)
         } else {
            expect(result.deletedAt).toBeNull()
         }
         expect(result.amenities).toEqual([{ id: 1, name: 'Wifi' }])
         expect(result.photoUrls).toEqual(['http://photo1.jpg'])
      }
   )

   it('does not create an outbox event when the status update fails', async () => {
      tx.properties.update.mockRejectedValue(new Error('update failed'))

      await expect(repository.updatePropertyStatus('property-123', 'paused')).rejects.toThrow(
         'update failed'
      )

      expect(tx.outbox_events.create).not.toHaveBeenCalled()
   })

   it('propagates outbox failures so the whole transaction can roll back', async () => {
      tx.properties.update.mockResolvedValue(propertyRecord('paused', null))
      tx.outbox_events.create.mockRejectedValue(new Error('outbox insert failed'))

      await expect(repository.updatePropertyStatus('property-123', 'paused')).rejects.toThrow(
         'outbox insert failed'
      )

      // The status update ran inside the same transaction, so a rejected outbox
      // insert must abort the whole interactive transaction (rolled back by Prisma)
      expect(tx.properties.update).toHaveBeenCalledTimes(1)
      expect(tx.outbox_events.create).toHaveBeenCalledTimes(1)
   })

   it('records a separate outbox event for every status change', async () => {
      tx.properties.update
         .mockResolvedValueOnce(propertyRecord('paused', null))
         .mockResolvedValueOnce(propertyRecord('active', null))

      await repository.updatePropertyStatus('property-123', 'paused')
      await repository.updatePropertyStatus('property-123', 'active')

      expect(tx.properties.update).toHaveBeenCalledTimes(2)
      expect(tx.outbox_events.create).toHaveBeenCalledTimes(2)
      const createCalls = tx.outbox_events.create.mock.calls as Array<
         [{ data: Record<string, unknown> }]
      >
      expect(createCalls[0][0].data).toMatchObject({ payload: { status: 'paused' } })
      expect(createCalls[1][0].data).toMatchObject({ payload: { status: 'active' } })
   })

   it('maps properties without amenities or photos to empty collections', async () => {
      const bareRecord = {
         ...propertyRecord('active', null),
         property_amenities: [],
         property_photos: []
      }
      tx.properties.update.mockResolvedValue(bareRecord)

      const result = await repository.updatePropertyStatus('property-123', 'active')

      expect(result.amenities).toEqual([])
      expect(result.photoUrls).toEqual([])
   })
})
