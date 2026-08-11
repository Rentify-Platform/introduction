import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { PasswordHasherPort } from '../ports/password-hasher.port'
import { TokenServicePort } from '../ports/token-service.port'
import { AccountRole } from '../../domain/account-role.type'
import {
   InvalidCredentialsException,
   AccountStatusException
} from '../../domain/errors/auth.errors'

export class LoginCommand {
   constructor(
      public readonly email: string,
      public readonly password: string
   ) {}
}

export class LoginResult {
   constructor(
      public readonly accessToken: string,
      public readonly account: {
         id: string
         email: string
         role: AccountRole
         firstName: string
         lastName: string
      }
   ) {}
}

@Injectable()
export class LoginUseCase {
   constructor(
      private readonly accountRepository: AccountRepository,
      private readonly passwordHasher: PasswordHasherPort,
      private readonly tokenService: TokenServicePort
   ) {}

   async execute(command: LoginCommand): Promise<LoginResult> {
      // 1. Load account
      const account = await this.accountRepository.findByEmail(command.email)
      if (!account) {
         throw new InvalidCredentialsException()
      }

      // 2. Validate password
      if (!account.passwordHash) {
         throw new InvalidCredentialsException()
      }

      const isPasswordValid = await this.passwordHasher.compare(
         command.password,
         account.passwordHash
      )
      if (!isPasswordValid) {
         throw new InvalidCredentialsException()
      }

      // 3. Check status
      if (account.status !== 'active') {
         throw new AccountStatusException(account.status)
      }

      // 4. Generate JWT
      const accessToken = await this.tokenService.generateToken({
         sub: account.id,
         email: account.email,
         role: account.role
      })

      // 5. Return result
      return new LoginResult(accessToken, {
         id: account.id,
         email: account.email,
         role: account.role,
         firstName: account.firstName,
         lastName: account.lastName
      })
   }
}
