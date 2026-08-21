import { Injectable } from '@nestjs/common'
import {
   AccountNotFoundException,
   AdminAccountStatusProtectedException
} from '../../domain/errors/auth.errors'
import { Account } from '../../domain/entities/auth.entity'
import { AccountRepository } from '../../domain/repositories/auth.repository'

export class UpdateAccountStatusCommand {
   constructor(
      public readonly accountId: string,
      public readonly status: 'active' | 'suspended' | 'banned'
   ) {}
}

@Injectable()
export class UpdateAccountStatusUseCase {
   constructor(private readonly accountRepository: AccountRepository) {}

   async execute(command: UpdateAccountStatusCommand): Promise<Account> {
      // 1. Verify the account exists before modifying
      const existing = await this.accountRepository.findById(command.accountId)
      if (!existing) {
         throw new AccountNotFoundException(command.accountId)
      }

      // 2. Admin accounts are immutable through the account-status workflow
      if (existing.role === 'admin') {
         throw new AdminAccountStatusProtectedException()
      }

      // 3. Apply the new status via the repository
      return this.accountRepository.updateStatus(command.accountId, command.status)
   }
}
