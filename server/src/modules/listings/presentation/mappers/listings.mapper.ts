import { PropertyLicense } from '../../domain/entities/property-license.entity'
import { Property } from '../../domain/entities/property.entity'
import { PropertyLicenseResponse } from '../responses/license.response'
import { ListingResponse } from '../responses/listing.response'

export class ListingsMapper {
   static toListingResponse(property: Property): ListingResponse {
      const isVnd = property.currency.toUpperCase() === 'VND'
      const price = isVnd ? Number(property.basePriceCents) : Number(property.basePriceCents) / 100
      const thumbnailUrl =
         property.photoUrls.length > 0
            ? property.photoUrls[0]
            : 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'

      return new ListingResponse(
         property.id,
         property.hostId,
         property.propertyTypeId,
         property.roomType,
         property.status,
         property.title,
         property.description,
         property.addressLine1,
         property.addressLine2,
         property.city,
         property.stateProvince,
         property.countryCode,
         property.postalCode,
         property.latitude,
         property.longitude,
         property.maxGuests,
         property.bedrooms,
         property.beds,
         property.bathrooms,
         property.basePriceCents.toString(),
         property.cleaningFeeCents.toString(),
         property.currency,
         property.minimumNights,
         property.maximumNights,
         property.checkInTime,
         property.checkOutTime,
         property.instantBook,
         property.cancellationPolicyCode,
         property.requiresLocalLicense,
         property.createdAt,
         property.updatedAt,
         property.publishedAt,
         property.deletedAt,
         property.amenities.map((a) => ({ id: a.id, name: a.name })),
         property.photoUrls,
         price,
         thumbnailUrl
      )
   }

   static toLicenseResponse(license: PropertyLicense): PropertyLicenseResponse {
      return new PropertyLicenseResponse(
         license.id,
         license.propertyId,
         license.licenseNumber,
         license.issuingAuthority,
         license.fileUrl,
         license.expiryDate,
         license.status,
         license.verifiedAt,
         license.createdAt
      )
   }
}
