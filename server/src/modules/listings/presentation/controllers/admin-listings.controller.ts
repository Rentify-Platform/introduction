import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common'
import { Authorize } from '../../../../shared/decorators/authorize.decorator'
import { ApiResponse } from '../../../../shared/response/api-response'
import {
   ListPropertiesAdminUseCase,
   ListPropertiesAdminCommand
} from '../../application/use-cases/list-properties-admin.usecase'
import {
   UpdatePropertyStatusAdminUseCase,
   UpdatePropertyStatusAdminCommand
} from '../../application/use-cases/update-property-status-admin.usecase'
import {
   GetPropertyLicenseAdminUseCase,
   GetPropertyLicenseAdminCommand
} from '../../application/use-cases/get-property-license-admin.usecase'
import { UpdatePropertyStatusAdminRequest } from '../requests/update-property-status-admin.request'
import { ListingsMapper } from '../mappers/listings.mapper'

@Controller('admin/properties')
export class AdminListingsController {
   constructor(
      private readonly listPropertiesAdminUseCase: ListPropertiesAdminUseCase,
      private readonly updatePropertyStatusAdminUseCase: UpdatePropertyStatusAdminUseCase,
      private readonly getPropertyLicenseAdminUseCase: GetPropertyLicenseAdminUseCase
   ) {}

   @Get()
   @Authorize('admin')
   async listProperties(
      @Query('search') search?: string,
      @Query('status') status?: string,
      @Query('hostId') hostId?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string
   ) {
      const command = new ListPropertiesAdminCommand(
         search,
         status,
         hostId,
         page ? parseInt(page, 10) : 1,
         limit ? parseInt(limit, 10) : 20
      )

      const result = await this.listPropertiesAdminUseCase.execute(command)

      return ApiResponse.success(
         {
            data: result.data.map(ListingsMapper.toListingResponse),
            total: result.total,
            page: result.page,
            limit: result.limit
         },
         'Properties retrieved successfully'
      )
   }

   @Get(':propertyId/license')
   @Authorize('admin')
   async getPropertyLicense(@Param('propertyId') propertyId: string) {
      const command = new GetPropertyLicenseAdminCommand(propertyId)
      const license = await this.getPropertyLicenseAdminUseCase.execute(command)

      return ApiResponse.success(
         license ? ListingsMapper.toLicenseResponse(license) : null,
         license ? 'License retrieved successfully' : 'No license submitted for this property'
      )
   }

   @Patch(':propertyId/status')
   @Authorize('admin')
   async updatePropertyStatus(
      @Param('propertyId') propertyId: string,
      @Body() request: UpdatePropertyStatusAdminRequest
   ) {
      const command = new UpdatePropertyStatusAdminCommand(propertyId, request.status)
      const property = await this.updatePropertyStatusAdminUseCase.execute(command)

      return ApiResponse.success(
         ListingsMapper.toListingResponse(property),
         `Property status updated to '${request.status}' successfully`
      )
   }
}
