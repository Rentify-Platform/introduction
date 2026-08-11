export class ApiResponse<T> {
   constructor(
      public readonly success: boolean,
      public readonly message: string,
      public readonly data: T | null,
      public readonly timestamp: string = new Date().toISOString()
   ) {}

   static success<T>(data: T, message = 'Success'): ApiResponse<T> {
      return new ApiResponse(true, message, data)
   }

   static failure<T>(message = 'Failure', data: T | null = null): ApiResponse<T> {
      return new ApiResponse(false, message, data)
   }
}
