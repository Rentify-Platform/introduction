import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'crypto'
import { PrismaModule } from '../src/prisma/prisma.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { ListingsPrismaRepository } from '../src/modules/listings/infrastructure/persistence/listings.prisma.repository'
import {
   UpdatePropertyStatusAdminCommand,
   UpdatePropertyStatusAdminUseCase
} from '../src/modules/listings/application/use-cases/update-property-status-admin.usecase'

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
const describeIfE2eDatabase = e2eDatabaseUrl ? describe : describe.skip

// Integration test: boots the real repository + use case against a real database
// (no HTTP), verifying the plan's Phase 4 integration checklist:
//   1. Check properties.status      -> properties row
//   2. Check deleted_at             -> properties row
//   3. Check event created          -> outbox_events row (event_type + payload)
//   4. Check update + event rollback together on failure -> trigger rejection
// plus the unified activation rule enforced by the database trigger:
// host KYC always required, verified license only when requires_local_license.
describeIfE2eDatabase('Admin property status outbox sync (integration)', () => {
   let moduleRef: TestingModule
   let prisma: PrismaService
   let repository: ListingsPrismaRepository
   let useCase: UpdatePropertyStatusAdminUseCase

   const runId = Date.now()

   let hostVerifiedId: string
   let hostUnverifiedId: string
   let propertyTypeId: number
   let licenseFreePropertyId: string
   let licenseRequiredPropertyId: string
   let unverifiedHostPropertyId: string

   const createAccount = async (role: 'admin' | 'guest' | 'host', kycVerified: boolean) => {
      const suffix = randomUUID().slice(0, 8)
      return prisma.accounts.create({
         data: {
            id: randomUUID(),
            email: `e2e-p4i-${role}-${runId}-${suffix}@rentify.test`,
            password_hash: 'integration-test-not-used',
            role,
            status: 'active',
            ...(role === 'host'
               ? { host_profiles: { create: { kyc_status: kycVerified ? 'verified' : 'pending' } } }
               : {})
         }
      })
   }

   const createProperty = async (
      hostId: string,
      requiresLocalLicense: boolean
   ): Promise<string> => {
      const property = await prisma.properties.create({
         data: {
            id: randomUUID(),
            host_id: hostId,
            property_type_id: propertyTypeId,
            room_type: 'entire_place',
            status: 'paused',
            title: `Integration Phase 4 Property ${runId}`,
            address_line1: '9 Integration Street',
            city: 'Hanoi',
            country_code: 'VN',
            latitude: 21.028511,
            longitude: 105.804817,
            max_guests: 4,
            base_price_cents: 1000000n,
            cancellation_policy_code: 'moderate',
            requires_local_license: requiresLocalLicense
         }
      })
      return property.id
   }

   const eventsFor = async (propertyId: string) =>
      prisma.outbox_events.findMany({
         where: { aggregate_type: 'property', aggregate_id: propertyId },
         orderBy: { created_at: 'asc' }
      })

   const propertyRow = async (propertyId: string) =>
      prisma.properties.findUniqueOrThrow({ where: { id: propertyId } })

   beforeAll(async () => {
      process.env.DATABASE_URL = e2eDatabaseUrl

      moduleRef = await Test.createTestingModule({
         imports: [PrismaModule]
      }).compile()
      await moduleRef.init()

      prisma = moduleRef.get(PrismaService)
      repository = new ListingsPrismaRepository(prisma)
      useCase = new UpdatePropertyStatusAdminUseCase(repository)

      const hostVerified = await createAccount('host', true)
      hostVerifiedId = hostVerified.id
      const hostUnverified = await createAccount('host', false)
      hostUnverifiedId = hostUnverified.id

      const propertyType = await prisma.property_types.create({
         data: { code: `e2e-p4i-type-${runId}`, label: 'Integration Phase 4 Type' }
      })
      propertyTypeId = propertyType.id

      licenseFreePropertyId = await createProperty(hostVerifiedId, false)
      licenseRequiredPropertyId = await createProperty(hostVerifiedId, true)
      unverifiedHostPropertyId = await createProperty(hostUnverifiedId, false)
   })

   afterAll(async () => {
      if (prisma) {
         const safe = async (fn: () => Promise<unknown>) => {
            try {
               await fn()
            } catch {
               // Ignore cleanup failures on the disposable E2E database
            }
         }
         const fixtureIds = [
            licenseFreePropertyId,
            licenseRequiredPropertyId,
            unverifiedHostPropertyId
         ]
         await safe(() =>
            prisma.outbox_events.deleteMany({
               where: { aggregate_type: 'property', aggregate_id: { in: fixtureIds } }
            })
         )
         await safe(() =>
            prisma.property_licenses.deleteMany({
               where: { property_id: { in: fixtureIds } }
            })
         )
         await safe(() => prisma.properties.deleteMany({ where: { id: { in: fixtureIds } } }))
         await safe(() => prisma.property_types.delete({ where: { id: propertyTypeId } }))
         await safe(() =>
            prisma.accounts.deleteMany({
               where: { id: { in: [hostVerifiedId, hostUnverifiedId] } }
            })
         )
      }
      await moduleRef?.close()
   })

   it('activates a license-free property and records one pending outbox event with the new status', async () => {
      const result = await useCase.execute(
         new UpdatePropertyStatusAdminCommand(licenseFreePropertyId, 'active')
      )
      expect(result.status).toBe('active')

      const row = await propertyRow(licenseFreePropertyId)
      expect(row.status).toBe('active')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(licenseFreePropertyId)
      expect(events).toHaveLength(1)
      expect(events[0].event_type).toBe('property.status.changed')
      expect(events[0].payload).toEqual({ status: 'active' })
      expect(events[0].status).toBe('pending')
   })

   it('pauses the property, keeps deleted_at null and records a paused event', async () => {
      await useCase.execute(new UpdatePropertyStatusAdminCommand(licenseFreePropertyId, 'paused'))

      const row = await propertyRow(licenseFreePropertyId)
      expect(row.status).toBe('paused')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(licenseFreePropertyId)
      expect(events).toHaveLength(2)
      expect(events[1].payload).toEqual({ status: 'paused' })
      expect(events[1].status).toBe('pending')
   })

   it('archives the property, sets deleted_at and records an archived event', async () => {
      await useCase.execute(new UpdatePropertyStatusAdminCommand(licenseFreePropertyId, 'archived'))

      const row = await propertyRow(licenseFreePropertyId)
      expect(row.status).toBe('archived')
      expect(row.deleted_at).not.toBeNull()

      const events = await eventsFor(licenseFreePropertyId)
      expect(events).toHaveLength(3)
      expect(events[2].payload).toEqual({ status: 'archived' })
      expect(events[2].status).toBe('pending')
   })

   it('rolls back update and event together when the database rejects activation (license required but missing)', async () => {
      // Bypass the use case validation on purpose to reach the database trigger:
      // fn_check_listing_activation must reject activation and the surrounding
      // transaction must leave neither a status change nor an orphan event.
      await expect(
         repository.updatePropertyStatus(licenseRequiredPropertyId, 'active')
      ).rejects.toThrow(/license/i)

      const row = await propertyRow(licenseRequiredPropertyId)
      expect(row.status).toBe('paused')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(licenseRequiredPropertyId)
      expect(events).toHaveLength(0)
   })

   it('enforces the host KYC activation rule at the database level without leaving side effects', async () => {
      await expect(
         repository.updatePropertyStatus(unverifiedHostPropertyId, 'active')
      ).rejects.toThrow(/kyc/i)

      const row = await propertyRow(unverifiedHostPropertyId)
      expect(row.status).toBe('paused')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(unverifiedHostPropertyId)
      expect(events).toHaveLength(0)
   })

   it('control case: activates the license-required property once a verified license exists', async () => {
      await prisma.property_licenses.create({
         data: {
            id: randomUUID(),
            property_id: licenseRequiredPropertyId,
            license_number: 'VN-P4I-0001',
            issuing_authority: 'Hanoi Authority',
            file_url: 'https://example.com/license-p4i.pdf',
            expiry_date: new Date('2099-01-01T00:00:00.000Z'),
            status: 'verified',
            verified_at: new Date()
         }
      })

      await repository.updatePropertyStatus(licenseRequiredPropertyId, 'active')

      const row = await propertyRow(licenseRequiredPropertyId)
      expect(row.status).toBe('active')
      expect(row.deleted_at).toBeNull()

      const events = await eventsFor(licenseRequiredPropertyId)
      expect(events).toHaveLength(1)
      expect(events[0].payload).toEqual({ status: 'active' })
      expect(events[0].status).toBe('pending')
   })
})
