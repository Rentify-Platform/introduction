export interface CreateOrderResult {
   vaNumber: string
   qrCodeUrl: string
   expiredAt: Date
}

export abstract class PaymentGatewayPort {
   abstract createOrder(params: {
      orderCode: string
      amountCents: bigint
      durationSeconds: number
   }): Promise<CreateOrderResult>
}
