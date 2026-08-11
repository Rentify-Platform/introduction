import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class PropertyNotFoundException extends BusinessException {
   constructor() {
      super('PROPERTY_NOT_FOUND', 'Property not found', HttpStatus.NOT_FOUND)
   }
}
