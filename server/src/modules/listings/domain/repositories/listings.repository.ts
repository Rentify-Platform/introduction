import { Property } from '../entities/property.entity'
import { PropertyLicense } from '../entities/property-license.entity'

export interface FindAllPropertiesFilter {
   search?: string
   status?: string
   hostId?: string
   page?: number
   limit?: number
}

export interface PaginatedProperties {
   data: Property[]
   total: number
   page: number
   limit: number
}

export abstract class ListingsRepository {
   abstract findById(id: string): Promise<Property | null>
   abstract save(property: Property): Promise<Property>
   abstract saveLicense(license: PropertyLicense): Promise<PropertyLicense>
   abstract findVerifiedLicenseByPropertyId(propertyId: string): Promise<PropertyLicense | null>
   abstract findLicenseByPropertyId(propertyId: string): Promise<PropertyLicense | null>
   abstract checkHostKycVerified(hostId: string): Promise<boolean>
   abstract populateCalendar(
      propertyId: string,
      basePriceCents: bigint,
      minimumNights: number,
      days: number
   ): Promise<void>
   abstract findPropertyTypeById(id: number): Promise<boolean>
   abstract saveAmenities(propertyId: string, amenityIds: number[]): Promise<void>
   abstract savePhotos(propertyId: string, photoUrls: string[]): Promise<void>
   abstract findManyByHostId(hostId: string): Promise<Property[]>
   abstract findAllAdmin(filter: FindAllPropertiesFilter): Promise<PaginatedProperties>
   abstract updatePropertyStatus(
      id: string,
      status: 'active' | 'paused' | 'archived'
   ): Promise<Property>
}
