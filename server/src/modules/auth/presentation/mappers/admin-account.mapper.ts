import { Account } from '../../domain/entities/auth.entity'
import { PaginatedAccounts } from '../../domain/repositories/auth.repository'

export class AccountSummaryResponse {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly phone: string | null,
      public readonly role: string,
      public readonly status: string,
      public readonly firstName: string,
      public readonly lastName: string,
      public readonly avatarUrl: string | null,
      public readonly guestKycStatus: string,
      public readonly createdAt: string
   ) {}
}

export class PaginatedAccountsResponse {
   constructor(
      public readonly data: AccountSummaryResponse[],
      public readonly total: number,
      public readonly page: number,
      public readonly limit: number
   ) {}
}

export class AdminAccountMapper {
   static toAccountSummary(account: Account): AccountSummaryResponse {
      return new AccountSummaryResponse(
         account.id,
         account.email,
         account.phone,
         account.role,
         account.status,
         account.firstName,
         account.lastName,
         account.avatarUrl,
         account.guestKycStatus,
         account.createdAt.toISOString()
      )
   }

   static toPaginatedResponse(result: PaginatedAccounts): PaginatedAccountsResponse {
      return new PaginatedAccountsResponse(
         result.data.map(AdminAccountMapper.toAccountSummary),
         result.total,
         result.page,
         result.limit
      )
   }
}
