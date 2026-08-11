import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { BusinessException } from '../exceptions/business.exception'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
   catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp()
      const response = ctx.getResponse<Response>()

      let status = HttpStatus.INTERNAL_SERVER_ERROR
      let errorCode = 'INTERNAL_SERVER_ERROR'
      let message = 'Internal server error'

      if (exception instanceof BusinessException) {
         status = exception.statusCode
         errorCode = exception.errorCode
         message = exception.message
      } else if (exception instanceof HttpException) {
         status = exception.getStatus()
         errorCode = this.mapHttpToErrorCode(status)
         const resContent = exception.getResponse()
         if (typeof resContent === 'object' && resContent !== null) {
            const msg = (resContent as any).message
            message = Array.isArray(msg) ? msg.join(', ') : msg || exception.message
         } else {
            message = exception.message
         }
      } else if (exception instanceof Error) {
         message = exception.message
      }

      if (status >= 500 || status === 400) {
         console.error('[HttpExceptionFilter] 500 Error:', exception)
      }

      response.status(status).json({
         success: false,
         errorCode,
         message,
         statusCode: status,
         timestamp: new Date().toISOString()
      })
   }

   private mapHttpToErrorCode(status: number): string {
      switch (status) {
         case HttpStatus.BAD_REQUEST:
            return 'BAD_REQUEST'
         case HttpStatus.UNAUTHORIZED:
            return 'UNAUTHORIZED'
         case HttpStatus.FORBIDDEN:
            return 'FORBIDDEN'
         case HttpStatus.NOT_FOUND:
            return 'NOT_FOUND'
         case HttpStatus.CONFLICT:
            return 'CONFLICT'
         default:
            return 'HTTP_ERROR'
      }
   }
}
