import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { AccountNotFoundException } from '../../domain/errors/auth.errors'
import { AccountRole } from '../../domain/account-role.type'

export class GetMeCommand {
   constructor(public readonly accountId: string) {}
}

export class GetMeResult {
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
export class GetMeUseCase {
   constructor(private readonly accountRepository: AccountRepository) {}

   async execute(command: GetMeCommand): Promise<GetMeResult> {
      const account = await this.accountRepository.findById(command.accountId)
      if (!account) {
         throw new AccountNotFoundException(command.accountId)
      }

      return new GetMeResult(
         account.id,
         account.email,
         account.phone,
         account.role,
         account.firstName,
         account.lastName,
         account.avatarUrl,
         account.bio,
         account.dateOfBirth,
         account.guestKycStatus,
         account.createdAt
      )
   }
}
