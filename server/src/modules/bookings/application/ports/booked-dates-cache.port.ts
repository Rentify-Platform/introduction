export abstract class BookedDatesCachePort {
   abstract getBookedDates(propertyId: string): Promise<string[] | null>
   abstract setBookedDates(propertyId: string, dates: string[]): Promise<void>
   abstract invalidate(propertyId: string): Promise<void>
}
