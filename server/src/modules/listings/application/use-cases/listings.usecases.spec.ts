import {
   CreateDraftListingUseCase,
   CreateDraftListingCommand
} from './create-draft-listing.usecase'
import {
   SetPricingAndAvailabilityUseCase,
   SetPricingAndAvailabilityCommand
} from './set-pricing-and-availability.usecase'
import {
   SubmitPropertyLicenseUseCase,
   SubmitPropertyLicenseCommand
} from './submit-property-license.usecase'
import { PublishListingUseCase, PublishListingCommand } from './publish-listing.usecase'
import {
   PauseArchiveListingUseCase,
   PauseArchiveListingCommand
} from './pause-archive-listing.usecase'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { Property } from '../../domain/entities/property.entity'
import { PropertyLicense } from '../../domain/entities/property-license.entity'
import {
   PropertyTypeNotFoundException,
   HostNotVerifiedException,
   PropertyLicenseRequiredException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'

describe('Listings Use Cases', () => {
   let listingsRepository: jest.Mocked<ListingsRepository>

   beforeEach(() => {
      listingsRepository = {
         findById: jest.fn(),
         save: jest.fn(),
         saveLicense: jest.fn(),
         findVerifiedLicenseByPropertyId: jest.fn(),
         findLicenseByPropertyId: jest.fn(),
         checkHostKycVerified: jest.fn(),
         populateCalendar: jest.fn(),
         findPropertyTypeById: jest.fn(),
         saveAmenities: jest.fn(),
         savePhotos: jest.fn(),
         findManyByHostId: jest.fn(),
         findAllAdmin: jest.fn(),
         updatePropertyStatus: jest.fn()
      }
   })

   describe('CreateDraftListingUseCase', () => {
      it('should successfully create a draft listing', async () => {
         listingsRepository.findPropertyTypeById.mockResolvedValue(true)
         let savedProperty: Property
         listingsRepository.save.mockImplementation(async (property) => {
            savedProperty = property
            return property
         })
         listingsRepository.findById.mockImplementation(async () => savedProperty)

         const useCase = new CreateDraftListingUseCase(listingsRepository)
         const command = new CreateDraftListingCommand(
            'host-123',
            1,
            'entire_place',
            'Cozy Cabin',
            'Nice description',
            '123 Main St',
            null,
            'Hanoi',
            null,
            'VN',
            null,
            21.0285,
            105.8542,
            4,
            2,
            3,
            1.5,
            1000000n,
            150000n,
            'VND',
            1,
            30,
            '15:00',
            '11:00',
            false,
            'moderate',
            false,
            [1, 2],
            ['http://photo1.jpg']
         )

         const result = await useCase.execute(command)

         expect(result.hostId).toBe('host-123')
         expect(result.status).toBe('draft')
         expect(listingsRepository.save).toHaveBeenCalled()
         expect(listingsRepository.saveAmenities).toHaveBeenCalledWith(result.id, [1, 2])
         expect(listingsRepository.savePhotos).toHaveBeenCalledWith(result.id, [
            'http://photo1.jpg'
         ])
      })

      it('should throw PropertyTypeNotFoundException if property type invalid', async () => {
         listingsRepository.findPropertyTypeById.mockResolvedValue(false)

         const useCase = new CreateDraftListingUseCase(listingsRepository)
         const command = new CreateDraftListingCommand(
            'host-123',
            99,
            'entire_place',
            'Invalid type property',
            null,
            '123 Main St',
            null,
            'Hanoi',
            null,
            'VN',
            null,
            0,
            0,
            2,
            0,
            0,
            0,
            500000n,
            0n,
            'VND',
            1,
            365,
            '15:00',
            '11:00',
            false,
            'moderate',
            false
         )

         await expect(useCase.execute(command)).rejects.toThrow(PropertyTypeNotFoundException)
      })
   })

   describe('SetPricingAndAvailabilityUseCase', () => {
      it('should successfully update pricing and generate calendar', async () => {
         const property = Property.create({
            hostId: 'host-123',
            propertyTypeId: 1,
            roomType: 'entire_place',
            title: 'Cabin',
            addressLine1: 'St',
            city: 'HN',
            countryCode: 'VN',
            latitude: 0,
            longitude: 0,
            maxGuests: 2,
            basePriceCents: 500000n
         })

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.save.mockImplementation(async (p) => p)

         const useCase = new SetPricingAndAvailabilityUseCase(listingsRepository)
         const command = new SetPricingAndAvailabilityCommand(
            property.id,
            'host-123',
            600000n,
            50000n,
            2,
            14,
            true
         )

         const result = await useCase.execute(command)

         expect(result.basePriceCents).toBe(600000n)
         expect(result.cleaningFeeCents).toBe(50000n)
         expect(result.minimumNights).toBe(2)
         expect(result.instantBook).toBe(true)
         expect(listingsRepository.populateCalendar).toHaveBeenCalledWith(
            property.id,
            600000n,
            2,
            730
         )
      })

      it('should throw UnauthorizedPropertyAccessException if owner mismatch', async () => {
         const property = Property.create({
            hostId: 'host-123',
            propertyTypeId: 1,
            roomType: 'entire_place',
            title: 'Cabin',
            addressLine1: 'St',
            city: 'HN',
            countryCode: 'VN',
            latitude: 0,
            longitude: 0,
            maxGuests: 2,
            basePriceCents: 500000n
         })

         listingsRepository.findById.mockResolvedValue(property)

         const useCase = new SetPricingAndAvailabilityUseCase(listingsRepository)
         const command = new SetPricingAndAvailabilityCommand(
            property.id,
            'wrong-host',
            600000n,
            50000n,
            2,
            14,
            true
         )

         await expect(useCase.execute(command)).rejects.toThrow(UnauthorizedPropertyAccessException)
      })
   })

   describe('SubmitPropertyLicenseUseCase', () => {
      it('should submit and auto-verify local license permit', async () => {
         const property = Property.create({
            hostId: 'host-123',
            propertyTypeId: 1,
            roomType: 'entire_place',
            title: 'Cabin',
            addressLine1: 'St',
            city: 'HN',
            countryCode: 'VN',
            latitude: 0,
            longitude: 0,
            maxGuests: 2,
            basePriceCents: 500000n
         })

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.saveLicense.mockImplementation(async (l) => l)

         const useCase = new SubmitPropertyLicenseUseCase(listingsRepository)
         const command = new SubmitPropertyLicenseCommand(
            property.id,
            'host-123',
            'LIC-999',
            'Hanoi Registry',
            'http://license.pdf',
            null
         )

         const result = await useCase.execute(command)

         expect(result.licenseNumber).toBe('LIC-999')
         expect(result.status).toBe('verified')
         expect(listingsRepository.saveLicense).toHaveBeenCalled()
      })
   })

   describe('PublishListingUseCase', () => {
      it('should successfully publish active listing when host KYC and license verified', async () => {
         // Listing requires local license
         const property = new Property(
            'prop-123',
            'host-123',
            1,
            'entire_place',
            'draft',
            'Title',
            null,
            'St',
            null,
            'HN',
            null,
            'VN',
            null,
            0,
            0,
            2,
            1,
            1,
            1,
            500000n,
            0n,
            'VND',
            1,
            365,
            '15:00',
            '11:00',
            false,
            'moderate',
            true, // requiresLocalLicense = true
            new Date(),
            new Date(),
            null,
            null
         )

         const license = new PropertyLicense(
            'lic-123',
            'prop-123',
            'LIC-123',
            'Auth',
            'http://url',
            null,
            'verified',
            new Date(),
            new Date()
         )

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.checkHostKycVerified.mockResolvedValue(true)
         listingsRepository.findVerifiedLicenseByPropertyId.mockResolvedValue(license)
         listingsRepository.save.mockImplementation(async (p) => p)

         const useCase = new PublishListingUseCase(listingsRepository)
         const command = new PublishListingCommand('prop-123', 'host-123')
         const result = await useCase.execute(command)

         expect(result.status).toBe('active')
         expect(result.publishedAt).toBeInstanceOf(Date)
         expect(listingsRepository.save).toHaveBeenCalled()
      })

      it('should throw HostNotVerifiedException if host KYC is unverified', async () => {
         const property = Property.create({
            hostId: 'host-123',
            propertyTypeId: 1,
            roomType: 'entire_place',
            title: 'Cabin',
            addressLine1: 'St',
            city: 'HN',
            countryCode: 'VN',
            latitude: 0,
            longitude: 0,
            maxGuests: 2,
            basePriceCents: 500000n
         })

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.checkHostKycVerified.mockResolvedValue(false)

         const useCase = new PublishListingUseCase(listingsRepository)
         const command = new PublishListingCommand(property.id, 'host-123')

         await expect(useCase.execute(command)).rejects.toThrow(HostNotVerifiedException)
      })

      it('should throw PropertyLicenseRequiredException if license missing', async () => {
         const property = new Property(
            'prop-123',
            'host-123',
            1,
            'entire_place',
            'draft',
            'Title',
            null,
            'St',
            null,
            'HN',
            null,
            'VN',
            null,
            0,
            0,
            2,
            1,
            1,
            1,
            500000n,
            0n,
            'VND',
            1,
            365,
            '15:00',
            '11:00',
            false,
            'moderate',
            true, // requiresLocalLicense = true
            new Date(),
            new Date(),
            null,
            null
         )

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.checkHostKycVerified.mockResolvedValue(true)
         listingsRepository.findVerifiedLicenseByPropertyId.mockResolvedValue(null) // missing!

         const useCase = new PublishListingUseCase(listingsRepository)
         const command = new PublishListingCommand('prop-123', 'host-123')

         await expect(useCase.execute(command)).rejects.toThrow(PropertyLicenseRequiredException)
      })
   })

   describe('PauseArchiveListingUseCase', () => {
      it('should pause an active listing successfully', async () => {
         const property = new Property(
            'prop-123',
            'host-123',
            1,
            'entire_place',
            'active', // must be active to pause
            'Title',
            null,
            'St',
            null,
            'HN',
            null,
            'VN',
            null,
            0,
            0,
            2,
            1,
            1,
            1,
            500000n,
            0n,
            'VND',
            1,
            365,
            '15:00',
            '11:00',
            false,
            'moderate',
            false,
            new Date(),
            new Date(),
            new Date(),
            null
         )

         listingsRepository.findById.mockResolvedValue(property)
         listingsRepository.save.mockImplementation(async (p) => p)

         const useCase = new PauseArchiveListingUseCase(listingsRepository)
         const command = new PauseArchiveListingCommand('prop-123', 'host-123', 'pause')
         const result = await useCase.execute(command)

         expect(result.status).toBe('paused')
         expect(listingsRepository.save).toHaveBeenCalled()
      })
   })
})
