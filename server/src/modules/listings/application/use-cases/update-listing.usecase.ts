import { Injectable } from '@nestjs/common'
import { Property, PropertyRoomType } from '../../domain/entities/property.entity'
import {
   PropertyNotFoundException,
   PropertyTypeNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class UpdateListingCommand {
   constructor(
      public readonly id: string,
      public readonly hostId: string,
      public readonly propertyTypeId: number,
      public readonly roomType: PropertyRoomType,
      public readonly title: string,
      public readonly description: string | null,
      public readonly addressLine1: string,
      public readonly addressLine2: string | null,
      public readonly city: string,
      public readonly stateProvince: string | null,
      public readonly countryCode: string,
      public readonly postalCode: string | null,
      public readonly latitude: number,
      public readonly longitude: number,
      public readonly maxGuests: number,
      public readonly bedrooms: number,
      public readonly beds: number,
      public readonly bathrooms: number,
      public readonly basePriceCents: bigint,
      public readonly cleaningFeeCents: bigint,
      public readonly currency: string,
      public readonly minimumNights: number,
      public readonly maximumNights: number,
      public readonly checkInTime: string,
      public readonly checkOutTime: string,
      public readonly instantBook: boolean,
      public readonly cancellationPolicyCode: string,
      public readonly requiresLocalLicense: boolean,
      public readonly amenityIds?: number[],
      public readonly photoUrls?: string[]
   ) {}
}

@Injectable()
export class UpdateListingUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: UpdateListingCommand): Promise<Property> {
      // 1.   Find property and check existence
      const property = await this.listingsRepository.findById(command.id)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2.   Check host ownership authorization
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3.   Verify property type exists
      const typeExists = await this.listingsRepository.findPropertyTypeById(command.propertyTypeId)
      if (!typeExists) {
         throw new PropertyTypeNotFoundException()
      }

      // 4.   Update property aggregate fields
      const updatedProperty = property.update({
         propertyTypeId: command.propertyTypeId,
         roomType: command.roomType,
         title: command.title,
         description: command.description,
         addressLine1: command.addressLine1,
         addressLine2: command.addressLine2,
         city: command.city,
         stateProvince: command.stateProvince,
         countryCode: command.countryCode,
         postalCode: command.postalCode,
         latitude: command.latitude,
         longitude: command.longitude,
         maxGuests: command.maxGuests,
         bedrooms: command.bedrooms,
         beds: command.beds,
         bathrooms: command.bathrooms,
         basePriceCents: command.basePriceCents,
         cleaningFeeCents: command.cleaningFeeCents,
         currency: command.currency,
         minimumNights: command.minimumNights,
         maximumNights: command.maximumNights,
         checkInTime: command.checkInTime,
         checkOutTime: command.checkOutTime,
         instantBook: command.instantBook,
         cancellationPolicyCode: command.cancellationPolicyCode,
         requiresLocalLicense: command.requiresLocalLicense
      })

      // 5.   Save updated property
      await this.listingsRepository.save(updatedProperty)

      // 6.   Save amenities mappings if provided
      if (command.amenityIds) {
         await this.listingsRepository.saveAmenities(property.id, command.amenityIds)
      }

      // 7.   Save photo mappings if provided
      if (command.photoUrls) {
         await this.listingsRepository.savePhotos(property.id, command.photoUrls)
      }

      // 8.   Reload updated entity with relations populated
      const reloadedProperty = await this.listingsRepository.findById(property.id)
      if (!reloadedProperty) {
         throw new PropertyNotFoundException()
      }

      return reloadedProperty
   }
}
