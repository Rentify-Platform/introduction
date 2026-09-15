import { BadRequestException } from '@nestjs/common'
import {
   parseAdminPagination,
   parseOptionalAdminDate,
   validateAdminDateRange
} from './admin-query-parser'

describe('admin query parser', () => {
   describe('parseAdminPagination', () => {
      it('uses safe defaults when values are absent', () => {
         expect(parseAdminPagination()).toEqual({ page: 1, limit: 20 })
      })

      it('accepts positive safe integers', () => {
         expect(parseAdminPagination('2', '50')).toEqual({ page: 2, limit: 50 })
      })

      it.each(['0', '-1', '1.5', 'abc', '12abc', '9007199254740992'])(
         'rejects invalid page value %s',
         (page) => {
            expect(() => parseAdminPagination(page, '20')).toThrow(BadRequestException)
         }
      )

      it.each(['0', '-1', '1.5', 'abc', '12abc', '9007199254740992'])(
         'rejects invalid limit value %s',
         (limit) => {
            expect(() => parseAdminPagination('1', limit)).toThrow(BadRequestException)
         }
      )
   })

   describe('parseOptionalAdminDate', () => {
      it('returns undefined when date is absent', () => {
         expect(parseOptionalAdminDate(undefined, 'dateFrom')).toBeUndefined()
      })

      it('parses a valid ISO date', () => {
         expect(parseOptionalAdminDate('2026-09-15T00:00:00.000Z', 'dateFrom')).toEqual(
            new Date('2026-09-15T00:00:00.000Z')
         )
      })

      it('rejects an invalid date instead of silently removing the filter', () => {
         expect(() => parseOptionalAdminDate('not-a-date', 'dateFrom')).toThrow(BadRequestException)
      })
   })

   describe('validateAdminDateRange', () => {
      it('accepts an ordered range and missing bounds', () => {
         expect(() =>
            validateAdminDateRange(
               new Date('2026-09-01'),
               new Date('2026-09-15'),
               'dateFrom',
               'dateTo'
            )
         ).not.toThrow()
         expect(() => validateAdminDateRange(undefined, undefined, 'from', 'to')).not.toThrow()
      })

      it('rejects a range whose lower bound is after its upper bound', () => {
         expect(() =>
            validateAdminDateRange(
               new Date('2026-09-15'),
               new Date('2026-09-01'),
               'dateFrom',
               'dateTo'
            )
         ).toThrow(BadRequestException)
      })
   })
})
