import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { Public } from '../../../../shared/decorators/public.decorator'
import { MeilisearchService } from '../../../../shared/meilisearch/meilisearch.service'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { AuthenticatedUser, CurrentUser } from '../../../auth/presentation/current-user.decorator'
import {
   CreateDraftListingCommand,
   CreateDraftListingUseCase
} from '../../application/use-cases/create-draft-listing.usecase'
import {
   PauseArchiveListingCommand,
   PauseArchiveListingUseCase
} from '../../application/use-cases/pause-archive-listing.usecase'
import {
   PublishListingCommand,
   PublishListingUseCase
} from '../../application/use-cases/publish-listing.usecase'
import {
   RestoreListingCommand,
   RestoreListingUseCase
} from '../../application/use-cases/restore-listing.usecase'
import {
   SetPricingAndAvailabilityCommand,
   SetPricingAndAvailabilityUseCase
} from '../../application/use-cases/set-pricing-and-availability.usecase'
import {
   SubmitPropertyLicenseCommand,
   SubmitPropertyLicenseUseCase
} from '../../application/use-cases/submit-property-license.usecase'
import {
   UpdateListingCommand,
   UpdateListingUseCase
} from '../../application/use-cases/update-listing.usecase'
import { PropertyRoomType } from '../../domain/entities/property.entity'
import { PropertyNotFoundException } from '../../domain/errors/listings.errors'
import { ListingsRepository } from '../../domain/repositories/listings.repository'
import { ListingsMapper } from '../mappers/listings.mapper'
import { CreateDraftListingRequest } from '../requests/create-draft-listing.request'
import { SetPricingRequest } from '../requests/set-pricing.request'
import { SubmitLicenseRequest } from '../requests/submit-license.request'
import { UpdateListingRequest } from '../requests/update-listing.request'

@ApiTags('Listings')
@Controller('properties')
export class ListingsController {
   constructor(
      private readonly createDraftListingUseCase: CreateDraftListingUseCase,
      private readonly updateListingUseCase: UpdateListingUseCase,
      private readonly setPricingAndAvailabilityUseCase: SetPricingAndAvailabilityUseCase,
      private readonly submitPropertyLicenseUseCase: SubmitPropertyLicenseUseCase,
      private readonly publishListingUseCase: PublishListingUseCase,
      private readonly pauseArchiveListingUseCase: PauseArchiveListingUseCase,
      private readonly restoreListingUseCase: RestoreListingUseCase,
      private readonly listingsRepository: ListingsRepository,
      private readonly meilisearchService: MeilisearchService
   ) {}

   @Post('admin/sync-all')
   @UseGuards(JwtAuthGuard)
   @Authorize('admin')
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Sync all properties to Meilisearch index (Admin only)' })
   async syncAll() {
      const count = await this.meilisearchService.syncAllProperties()
      return ApiResponse.success(
         { count },
         `Successfully synchronized ${count} listings to Meilisearch`
      )
   }

   @Post('draft')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Create a new draft property listing' })
   async createDraft(
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: CreateDraftListingRequest
   ) {
      const command = new CreateDraftListingCommand(
         user.id,
         request.propertyTypeId,
         request.roomType as PropertyRoomType,
         request.title,
         request.description || null,
         request.addressLine1,
         request.addressLine2 || null,
         request.city,
         request.stateProvince || null,
         request.countryCode,
         request.postalCode || null,
         request.latitude,
         request.longitude,
         request.maxGuests,
         request.bedrooms || 0,
         request.beds || 0,
         request.bathrooms || 0,
         BigInt(request.basePriceCents),
         BigInt(request.cleaningFeeCents || '0'),
         request.currency || 'VND',
         request.minimumNights || 1,
         request.maximumNights || 365,
         request.checkInTime || '15:00',
         request.checkOutTime || '11:00',
         request.instantBook || false,
         request.cancellationPolicyCode || 'moderate',
         request.requiresLocalLicense || false,
         request.amenityIds,
         request.photoUrls
      )

      const property = await this.createDraftListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Draft listing created successfully'
      )
   }

   @Patch(':id')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Update an existing property listing' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async update(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: UpdateListingRequest
   ) {
      const command = new UpdateListingCommand(
         id,
         user.id,
         request.propertyTypeId,
         request.roomType as PropertyRoomType,
         request.title,
         request.description || null,
         request.addressLine1,
         request.addressLine2 || null,
         request.city,
         request.stateProvince || null,
         request.countryCode,
         request.postalCode || null,
         request.latitude,
         request.longitude,
         request.maxGuests,
         request.bedrooms || 0,
         request.beds || 0,
         request.bathrooms || 0,
         BigInt(request.basePriceCents),
         BigInt(request.cleaningFeeCents || '0'),
         request.currency || 'VND',
         request.minimumNights || 1,
         request.maximumNights || 365,
         request.checkInTime || '15:00',
         request.checkOutTime || '11:00',
         request.instantBook || false,
         request.cancellationPolicyCode || 'moderate',
         request.requiresLocalLicense || false,
         request.amenityIds,
         request.photoUrls
      )

      const property = await this.updateListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Property listing updated successfully'
      )
   }

   @Post(':id/pricing')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Set pricing and availability rules for a listing' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async setPricing(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: SetPricingRequest
   ) {
      const command = new SetPricingAndAvailabilityCommand(
         id,
         user.id,
         BigInt(request.basePriceCents),
         BigInt(request.cleaningFeeCents),
         request.minimumNights,
         request.maximumNights,
         request.instantBook
      )

      const property = await this.setPricingAndAvailabilityUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Pricing and availability calendar updated successfully'
      )
   }

   @Post(':id/license')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Submit local operating license for a property' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async submitLicense(
      @Param('id') id: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: SubmitLicenseRequest
   ) {
      const command = new SubmitPropertyLicenseCommand(
         id,
         user.id,
         request.licenseNumber,
         request.issuingAuthority,
         request.fileUrl,
         request.expiryDate ? new Date(request.expiryDate) : null
      )

      const license = await this.submitPropertyLicenseUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toLicenseResponse(license),
         'Property license submitted and verified successfully'
      )
   }

   @Post(':id/publish')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Publish a draft property listing' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new PublishListingCommand(id, user.id)
      const property = await this.publishListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Listing published successfully'
      )
   }

   @Post(':id/pause')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Pause an active property listing' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async pause(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new PauseArchiveListingCommand(id, user.id, 'pause')
      const property = await this.pauseArchiveListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Listing paused successfully'
      )
   }

   @Post(':id/archive')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Archive a property listing' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new PauseArchiveListingCommand(id, user.id, 'archive')
      const property = await this.pauseArchiveListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Listing archived successfully'
      )
   }

   @Post(':id/restore')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Restore a paused/archived listing to draft' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
      const command = new RestoreListingCommand(id, user.id)
      const property = await this.restoreListingUseCase.execute(command)
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Listing restored to draft successfully'
      )
   }

   @Get('host/my-listings')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('bearer')
   @ApiOperation({ summary: 'Get all property listings owned by the logged-in host' })
   async getMyListings(@CurrentUser() user: AuthenticatedUser) {
      const properties = await this.listingsRepository.findManyByHostId(user.id)
      return ApiResponse.success(
         properties.map((p) => ListingsMapper.toListingResponse(p)),
         'Host listings retrieved successfully'
      )
   }

   @Get('detail/:id')
   @Public()
   @ApiOperation({ summary: 'Get full details of a property listing including reviews' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async getPropertyDetail(@Param('id') id: string) {
      const property = await this.listingsRepository.findById(id)
      if (!property) {
         throw new PropertyNotFoundException()
      }
      return ApiResponse.success(
         {
            property: ListingsMapper.toListingResponse(property),
            reviews: [],
            averageRating: 0,
            totalReviews: 0
         },
         'Listing details retrieved successfully'
      )
   }

   @Get(':id')
   @Public()
   @ApiOperation({ summary: 'Get basic property details by ID' })
   @ApiParam({ name: 'id', type: String, description: 'Property UUID' })
   async getProperty(@Param('id') id: string) {
      const property = await this.listingsRepository.findById(id)
      if (!property) {
         throw new PropertyNotFoundException()
      }
      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         'Listing details retrieved successfully'
      )
   }
}
