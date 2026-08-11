import { Injectable, Logger } from '@nestjs/common'
import { PaymentGatewayPort, CreateOrderResult } from '../../application/ports/payment-gateway.port'
import { ConfigurationException } from '../../../../shared/exceptions/configuration.exception'

@Injectable()
export class SepayPaymentGateway implements PaymentGatewayPort {
   private readonly logger = new Logger(SepayPaymentGateway.name)

   async createOrder(params: {
      orderCode: string
      amountCents: bigint
      durationSeconds: number
   }): Promise<CreateOrderResult> {
      const apiToken = process.env.SEPAY_API_TOKEN
      const bankAccountId = process.env.SEPAY_BANK_ACCOUNT_ID
      const amountVnd = Number(params.amountCents / 100n)

      if (!apiToken || !bankAccountId || apiToken === 'mock') {
         throw new ConfigurationException(
            'SEPAY_API_TOKEN or SEPAY_BANK_ACCOUNT_ID is missing or configured as mock in environment variables.'
         )
      }

      const bankSlug = (process.env.SEPAY_BANK_SLUG || 'bidv').toLowerCase()
      const url = `https://my.sepay.vn/userapi/${bankSlug}/${bankAccountId}/orders`

      this.logger.log(
         `Calling SePay API to create dynamic VA for order ${params.orderCode} (Amount: ${amountVnd} VND)`
      )

      try {
         const response = await fetch(url, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${apiToken}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               amount: amountVnd,
               order_code: params.orderCode,
               duration: params.durationSeconds,
               with_qrcode: true
            })
         })

         if (!response.ok) {
            const errText = await response.text()
            this.logger.error(`SePay API error response (Status: ${response.status}): ${errText}`)
            throw new Error(`Failed to create order on SePay: ${response.statusText}`)
         }

         const result = await response.json()
         if (result.status !== 'success') {
            this.logger.error(`SePay API returned failure: ${JSON.stringify(result)}`)
            throw new Error(result.message || 'SePay order creation failed')
         }

         const data = result.data
         const expiredAtDate = data.expired_at
            ? new Date(data.expired_at)
            : new Date(Date.now() + params.durationSeconds * 1000)

         return {
            vaNumber: data.va_number,
            qrCodeUrl: data.qr_code_url || data.qr_code || '',
            expiredAt: expiredAtDate
         }
      } catch (error) {
         this.logger.error(`Failed to call SePay API: ${error.message}`, error.stack)
         throw error
      }
   }
}
