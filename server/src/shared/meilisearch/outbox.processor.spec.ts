import { OutboxProcessor } from './outbox.processor'
import { PrismaService } from '../../prisma/prisma.service'
import { MeilisearchService } from './meilisearch.service'

// @nestjs/schedule and meilisearch ship ESM-only output that the unit jest
// config cannot parse; both are irrelevant boundaries to the behavior under test
jest.mock('@nestjs/schedule', () => ({
   Interval: () => () => undefined
}))
jest.mock('meilisearch', () => ({
   Meilisearch: class {},
   Index: class {}
}))

const activePropertyRecord = {
   id: 'property-1',
   title: 'Worker Sync Property',
   description: 'A property used in outbox processor unit tests',
   status: 'active',
   room_type: 'entire_place',
   property_types: { label: 'Apartment' },
   city: 'Hanoi',
   address_line1: '1 Worker Street',
   base_price_cents: 1000000n,
   max_guests: 4,
   bedrooms: 2,
   beds: 2,
   bathrooms: 1,
   property_amenities: [{ amenities: { label: 'Wifi' } }],
   property_photos: [{ url: 'http://photo1.jpg' }],
   accounts: {
      id: 'host-1',
      profiles: { first_name: 'Phase', last_name: 'Four', avatar_url: 'http://avatar.png' }
   },
   latitude: 21.0285,
   longitude: 105.8542,
   created_at: new Date('2026-09-01T00:00:00.000Z'),
   deleted_at: null
}

const pendingEvent = (overrides: Record<string, unknown> = {}) => ({
   id: 'event-1',
   aggregate_id: 'property-1',
   aggregate_type: 'property',
   event_type: 'property.status.changed',
   payload: { status: 'active' },
   status: 'pending',
   attempts: 0,
   error_message: null,
   ...overrides
})

describe('OutboxProcessor', () => {
   let prisma: {
      outbox_events: { findMany: jest.Mock; update: jest.Mock }
      properties: { findUnique: jest.Mock }
   }
   let index: { addDocuments: jest.Mock; deleteDocument: jest.Mock }
   let processor: OutboxProcessor

   beforeEach(() => {
      prisma = {
         outbox_events: { findMany: jest.fn(), update: jest.fn() },
         properties: { findUnique: jest.fn() }
      }
      index = { addDocuments: jest.fn(), deleteDocument: jest.fn() }
      processor = new OutboxProcessor(
         prisma as unknown as PrismaService,
         { getPropertiesIndex: () => index } as unknown as MeilisearchService
      )
   })

   const updateCalls = (): Array<Record<string, unknown>> =>
      (prisma.outbox_events.update.mock.calls as Array<[{ data: Record<string, unknown> }]>).map(
         (call) => call[0].data
      )

   it('polls only pending or failed events with fewer than 5 attempts', async () => {
      prisma.outbox_events.findMany.mockResolvedValue([])

      await processor.processOutboxEvents()

      expect(prisma.outbox_events.findMany).toHaveBeenCalledWith(
         expect.objectContaining({
            where: {
               status: { in: ['pending', 'failed'] },
               attempts: { lt: 5 }
            }
         })
      )
      expect(prisma.outbox_events.update).not.toHaveBeenCalled()
   })

   it('indexes an active, non-deleted property with the full search document', async () => {
      prisma.outbox_events.findMany.mockResolvedValue([pendingEvent()])
      prisma.properties.findUnique.mockResolvedValue(activePropertyRecord)

      await processor.processOutboxEvents()

      expect(index.addDocuments).toHaveBeenCalledTimes(1)
      const addCalls = index.addDocuments.mock.calls as Array<[Array<Record<string, unknown>>]>
      const document = addCalls[0][0][0]
      expect(document).toMatchObject({
         id: 'property-1',
         title: 'Worker Sync Property',
         status: 'active',
         city: 'Hanoi',
         price_cents: 1000000,
         amenities: ['Wifi'],
         photos: ['http://photo1.jpg'],
         property_type: 'Apartment',
         host: { id: 'host-1', name: 'Phase Four' }
      })
      expect(index.deleteDocument).not.toHaveBeenCalled()

      const updates = updateCalls()
      expect(updates[0]).toMatchObject({ status: 'processing', attempts: { increment: 1 } })
      expect(updates[1]).toMatchObject({ status: 'completed', error_message: null })
   })

   it('removes the document when the active property is deleted or missing', async () => {
      prisma.outbox_events.findMany.mockResolvedValue([pendingEvent()])
      prisma.properties.findUnique.mockResolvedValue({
         ...activePropertyRecord,
         deleted_at: new Date()
      })

      await processor.processOutboxEvents()

      expect(index.deleteDocument).toHaveBeenCalledWith('property-1')
      expect(index.addDocuments).not.toHaveBeenCalled()
      expect(updateCalls()[1]).toMatchObject({ status: 'completed' })
   })

   it('removes the document directly for non-active statuses without querying the property', async () => {
      prisma.outbox_events.findMany.mockResolvedValue([
         pendingEvent({ payload: { status: 'paused' } })
      ])

      await processor.processOutboxEvents()

      expect(index.deleteDocument).toHaveBeenCalledWith('property-1')
      expect(prisma.properties.findUnique).not.toHaveBeenCalled()
      expect(index.addDocuments).not.toHaveBeenCalled()
      expect(updateCalls()[1]).toMatchObject({ status: 'completed', error_message: null })
   })

   it('marks the event as failed with the error message when syncing fails', async () => {
      prisma.outbox_events.findMany.mockResolvedValue([pendingEvent()])
      prisma.properties.findUnique.mockResolvedValue(activePropertyRecord)
      index.addDocuments.mockRejectedValue(new Error('meili down'))

      await processor.processOutboxEvents()

      const updates = updateCalls()
      expect(updates[0]).toMatchObject({ status: 'processing', attempts: { increment: 1 } })
      expect(updates[1]).toMatchObject({ status: 'failed' })
      expect(String(updates[1].error_message)).toContain('meili down')
   })

   it('retries a previously failed event and completes it on a later run', async () => {
      prisma.outbox_events.findMany
         .mockResolvedValueOnce([pendingEvent()])
         .mockResolvedValueOnce([pendingEvent({ status: 'failed', attempts: 1 })])
      prisma.properties.findUnique.mockResolvedValue(activePropertyRecord)
      index.addDocuments
         .mockRejectedValueOnce(new Error('transient failure'))
         .mockResolvedValueOnce(undefined)

      await processor.processOutboxEvents()
      await processor.processOutboxEvents()

      expect(index.addDocuments).toHaveBeenCalledTimes(2)
      const updates = updateCalls()
      expect(updates[updates.length - 1]).toMatchObject({
         status: 'completed',
         error_message: null
      })
   })
})
