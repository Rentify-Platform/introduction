export abstract class BookingLockPort {
   abstract acquireLock(
      propertyId: string,
      checkIn: Date,
      checkOut: Date,
      bookingId: string,
      ttlSeconds: number
   ): Promise<boolean>

   abstract releaseLock(propertyId: string, checkIn: Date, checkOut: Date): Promise<void>
}
