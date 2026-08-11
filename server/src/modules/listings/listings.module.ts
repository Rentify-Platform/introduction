import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CreateDraftListingUseCase } from './application/use-cases/create-draft-listing.usecase'
import { PauseArchiveListingUseCase } from './application/use-cases/pause-archive-listing.usecase'
import { PublishListingUseCase } from './application/use-cases/publish-listing.usecase'
import { RestoreListingUseCase } from './application/use-cases/restore-listing.usecase'
import { SetPricingAndAvailabilityUseCase } from './application/use-cases/set-pricing-and-availability.usecase'
import { SubmitPropertyLicenseUseCase } from './application/use-cases/submit-property-license.usecase'
import { UpdateListingUseCase } from './application/use-cases/update-listing.usecase'
import { ListPropertiesAdminUseCase } from './application/use-cases/list-properties-admin.usecase'
import { UpdatePropertyStatusAdminUseCase } from './application/use-cases/update-property-status-admin.usecase'
import { GetPropertyLicenseAdminUseCase } from './application/use-cases/get-property-license-admin.usecase'
import { ListingsInfrastructureModule } from './infrastructure/listings.infrastructure.module'
import { ListingsController } from './presentation/controllers/listings.controller'
import { AdminListingsController } from './presentation/controllers/admin-listings.controller'

@Module({
   imports: [ListingsInfrastructureModule, AuthModule],
   controllers: [ListingsController, AdminListingsController],
   providers: [
      CreateDraftListingUseCase,
      UpdateListingUseCase,
      SetPricingAndAvailabilityUseCase,
      SubmitPropertyLicenseUseCase,
      PublishListingUseCase,
      PauseArchiveListingUseCase,
      RestoreListingUseCase,
      ListPropertiesAdminUseCase,
      UpdatePropertyStatusAdminUseCase,
      GetPropertyLicenseAdminUseCase
   ],
   exports: [
      CreateDraftListingUseCase,
      UpdateListingUseCase,
      SetPricingAndAvailabilityUseCase,
      SubmitPropertyLicenseUseCase,
      PublishListingUseCase,
      PauseArchiveListingUseCase,
      RestoreListingUseCase,
      ListingsInfrastructureModule
   ]
})
export class ListingsModule {}
