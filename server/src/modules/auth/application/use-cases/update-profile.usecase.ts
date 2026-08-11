import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { AccountNotFoundException } from '../../domain/errors/auth.errors'
import { Account } from '../../domain/entities/auth.entity'

import { AccountRole } from '../../domain/account-role.type'

export class UpdateProfileCommand {
   constructor(
      public readonly accountId: string,
      public readonly firstName?: string,
      public readonly lastName?: string,
      public readonly phone?: string | null,
      public readonly bio?: string | null,
      public readonly avatarUrl?: string | null,
      public readonly dateOfBirth?: Date | null
   ) {}
}

export class UpdateProfileResult {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly phone: string | null,
      public readonly role: AccountRole,
      public readonly firstName: string,
      public readonly lastName: string,
      public readonly avatarUrl: string | null,
      public readonly bio: string | null,
      public readonly dateOfBirth: Date | null,
      public readonly guestKycStatus: string,
      public readonly createdAt: Date
   ) {}
}

@Injectable()
export class UpdateProfileUseCase {
   constructor(private readonly accountRepository: AccountRepository) {}

   async execute(command: UpdateProfileCommand): Promise<UpdateProfileResult> {
      const account = await this.accountRepository.findById(command.accountId)
      if (!account) {
         throw new AccountNotFoundException(command.accountId)
      }

      const updatedAccount = new Account(
         account.id,
         account.email,
         command.phone !== undefined ? command.phone : account.phone,
         account.passwordHash,
         account.role,
         account.status,
         command.firstName !== undefined ? command.firstName.trim() : account.firstName,
         command.lastName !== undefined ? command.lastName.trim() : account.lastName,
         account.createdAt,
         new Date(),
         command.avatarUrl !== undefined ? command.avatarUrl : account.avatarUrl,
         command.bio !== undefined ? command.bio : account.bio,
         command.dateOfBirth !== undefined
            ? command.dateOfBirth
               ? new Date(command.dateOfBirth)
               : null
            : account.dateOfBirth,
         account.guestKycStatus
      )

      if (updatedAccount.firstName.length === 0 || updatedAccount.lastName.length === 0) {
         throw new Error('First name and last name cannot be empty')
      }

      const savedAccount = await this.accountRepository.save(updatedAccount)

      return new UpdateProfileResult(
         savedAccount.id,
         savedAccount.email,
         savedAccount.phone,
         savedAccount.role,
         savedAccount.firstName,
         savedAccount.lastName,
         savedAccount.avatarUrl,
         savedAccount.bio,
         savedAccount.dateOfBirth,
         savedAccount.guestKycStatus,
         savedAccount.createdAt
      )
   }
}
