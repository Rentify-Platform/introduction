import { Injectable } from '@nestjs/common'
import { Property } from '../../domain/entities/property.entity'
import {
   PropertyNotFoundException,
   UnauthorizedPropertyAccessException
} from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'

export class SetPricingAndAvailabilityCommand {
   constructor(
      public readonly propertyId: string,
      public readonly hostId: string,
      public readonly basePriceCents: bigint,
      public readonly cleaningFeeCents: bigint,
      public readonly minimumNights: number,
      public readonly maximumNights: number,
      public readonly instantBook: boolean
   ) {}
}

@Injectable()
export class SetPricingAndAvailabilityUseCase {
   constructor(private readonly listingsRepository: ListingsRepository) {}

   async execute(command: SetPricingAndAvailabilityCommand): Promise<Property> {
      // 1. Fetch property
      const property = await this.listingsRepository.findById(command.propertyId)
      if (!property) {
         throw new PropertyNotFoundException()
      }

      // 2. Authorize
      if (property.hostId !== command.hostId) {
         throw new UnauthorizedPropertyAccessException()
      }

      // 3. Update domain entity
      const updatedProperty = property.updatePricingAndAvailability({
         basePriceCents: command.basePriceCents,
         cleaningFeeCents: command.cleaningFeeCents,
         minimumNights: command.minimumNights,
         maximumNights: command.maximumNights,
         instantBook: command.instantBook
      })

      // 4. Save property
      const savedProperty = await this.listingsRepository.save(updatedProperty)

      // 5. Populate property_calendar availability for next 730 days
      await this.listingsRepository.populateCalendar(
         savedProperty.id,
         savedProperty.basePriceCents,
         savedProperty.minimumNights,
         730
      )

      return savedProperty
   }
}
