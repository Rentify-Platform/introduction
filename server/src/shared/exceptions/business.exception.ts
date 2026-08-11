import { HttpStatus } from '@nestjs/common'

export abstract class BusinessException extends Error {
   constructor(
      public readonly errorCode: string,
      message: string,
      public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST
   ) {
      super(message)
      this.name = this.constructor.name
      Object.setPrototypeOf(this, new.target.prototype)
   }
}
