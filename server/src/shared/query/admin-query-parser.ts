import { BadRequestException } from '@nestjs/common'

export const DEFAULT_ADMIN_PAGE = 1
export const DEFAULT_ADMIN_LIMIT = 20

export function parseAdminPagination(page?: string, limit?: string) {
   return {
      page: parsePositiveInteger(page, 'page', DEFAULT_ADMIN_PAGE),
      limit: parsePositiveInteger(limit, 'limit', DEFAULT_ADMIN_LIMIT)
   }
}

function parsePositiveInteger(value: string | undefined, name: string, fallback: number): number {
   if (value === undefined || value === '') return fallback

   const parsed = Number(value)
   if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${name} must be a positive safe integer`)
   }

   return parsed
}

export function parseOptionalAdminDate(value: string | undefined, name: string): Date | undefined {
   if (value === undefined || value === '') return undefined

   const parsed = new Date(value)
   if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${name} must be a valid ISO date`)
   }

   return parsed
}

export function validateAdminDateRange(
   from: Date | undefined,
   to: Date | undefined,
   fromName: string,
   toName: string
): void {
   if (from && to && from > to) {
      throw new BadRequestException(`${fromName} must be before or equal to ${toName}`)
   }
}
