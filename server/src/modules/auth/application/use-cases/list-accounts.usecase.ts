import { Injectable } from '@nestjs/common'
import { AccountRepository, FindAllAccountsFilter, PaginatedAccounts } from '../../domain/repositories/auth.repository'

export class ListAccountsCommand {
   constructor(
      public readonly search?: string,
      public readonly role?: string,
      public readonly status?: string,
      public readonly page?: number,
      public readonly limit?: number
   ) {}
}

@Injectable()
export class ListAccountsUseCase {
   constructor(private readonly accountRepository: AccountRepository) {}

   async execute(command: ListAccountsCommand): Promise<PaginatedAccounts> {
      // 1. Build filter from command
      const filter: FindAllAccountsFilter = {
         search: command.search,
         role: command.role,
         status: command.status,
         page: command.page ?? 1,
         limit: command.limit ?? 20
      }

      // 2. Delegate to repository
      return this.accountRepository.findAll(filter)
   }
}
