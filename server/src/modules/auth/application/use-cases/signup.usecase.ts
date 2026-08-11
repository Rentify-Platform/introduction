import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { PasswordHasherPort } from '../ports/password-hasher.port'
import { Account } from '../../domain/entities/auth.entity'
import { AccountRole } from '../../domain/account-role.type'
import { EmailAlreadyRegisteredException } from '../../domain/errors/auth.errors'

export class SignupCommand {
   constructor(
      public readonly email: string,
      public readonly phone: string | null,
      public readonly password: string,
      public readonly firstName: string,
      public readonly lastName: string
   ) {}
}

export class SignupResult {
   constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly role: AccountRole
   ) {}
}

@Injectable()
export class SignupUseCase {
   constructor(
      private readonly accountRepository: AccountRepository,
      private readonly passwordHasher: PasswordHasherPort
   ) {}

   async execute(command: SignupCommand): Promise<SignupResult> {
      // 1. Duplicate check
      const emailExists = await this.accountRepository.existsByEmail(command.email)
      if (emailExists) {
         throw new EmailAlreadyRegisteredException(command.email)
      }

      // 2. Hash password
      const hashedPassword = await this.passwordHasher.hash(command.password)

      // 3. Call domain behavior
      const account = Account.create({
         email: command.email,
         phone: command.phone,
         passwordHash: hashedPassword,
         role: 'guest',
         firstName: command.firstName,
         lastName: command.lastName
      })

      // 4. Persist
      const savedAccount = await this.accountRepository.save(account)

      // 5. Return result
      return new SignupResult(savedAccount.id, savedAccount.email, savedAccount.role)
   }
}
