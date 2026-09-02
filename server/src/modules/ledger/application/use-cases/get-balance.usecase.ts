import { Injectable } from '@nestjs/common'
import { LedgerRepository } from '../../domain/repositories/ledger.repository'
import { LedgerAccount, LedgerOwnerType } from '../../domain/entities/ledger-account.entity'
import { LedgerBalance } from '../../domain/entities/ledger-balance.entity'
import {
   LedgerAccountNotFoundException,
   LedgerAccountForbiddenException
} from '../../domain/errors/ledger.errors'

// Platform/tax_authority scopes belong to the system; personal actors may only
// touch accounts whose owner is themselves.
const PERSONAL_OWNER_TYPES: readonly LedgerOwnerType[] = ['host', 'guest']

export class GetBalanceActor {
   constructor(
      public readonly accountId: string | null,
      public readonly role: string
   ) {}

   /** Internal services (payment, cancellation, payout, tax flows) act as the system. */
   static system(): GetBalanceActor {
      return new GetBalanceActor(null, 'system')
   }

   static fromAuthenticatedUser(user: { id: string; role: string }): GetBalanceActor {
      return new GetBalanceActor(user.id, user.role)
   }

   get isUnrestricted(): boolean {
      return this.role === 'admin' || this.role === 'system'
   }
}

export class GetBalanceCommand {
   constructor(
      public readonly ledgerAccountId: string | null,
      public readonly ownerType: LedgerOwnerType | null,
      public readonly ownerAccountId: string | null,
      public readonly accountSubtype: string | null,
      public readonly currency: string | null,
      public readonly actor: GetBalanceActor
   ) {}
}

@Injectable()
export class GetBalanceUseCase {
   constructor(private readonly ledgerRepository: LedgerRepository) {}

   async execute(command: GetBalanceCommand): Promise<LedgerBalance> {
      if (command.actor.isUnrestricted) {
         return this.resolveBalance(
            command.ledgerAccountId,
            command.ownerType,
            command.ownerAccountId,
            command.accountSubtype,
            command.currency
         )
      }

      return this.executeWithOwnerScope(command)
   }

   private async executeWithOwnerScope(command: GetBalanceCommand): Promise<LedgerBalance> {
      const actor = command.actor
      if (!actor.accountId) {
         throw new LedgerAccountForbiddenException(
            'Authenticated account identity is required to read a ledger balance.'
         )
      }

      if (command.ledgerAccountId) {
         const account = await this.ledgerRepository.findAccountById(command.ledgerAccountId)
         if (!account || !this.isOwnedBy(account, actor.accountId)) {
            // Not found (instead of forbidden) so the existence of a foreign
            // account is never revealed.
            throw new LedgerAccountNotFoundException('Ledger account not found.')
         }
         const balance = await this.ledgerRepository.findBalance(account.id)
         if (!balance) {
            return new LedgerBalance(account.id, 0n, new Date())
         }
         return balance
      }

      if (!command.ownerType || !command.accountSubtype || !command.currency) {
         throw new LedgerAccountNotFoundException(
            'Must provide either ledgerAccountId or ownerType/accountSubtype/currency to retrieve balance.'
         )
      }

      if (!PERSONAL_OWNER_TYPES.includes(command.ownerType)) {
         throw new LedgerAccountForbiddenException(
            'Only personal host or guest ledger accounts are accessible to your role.'
         )
      }

      if (command.ownerAccountId && command.ownerAccountId !== actor.accountId) {
         // Ownership cannot be widened via query parameters; foreign accounts
         // must never be resolved (or created) for the caller.
         throw new LedgerAccountNotFoundException('Ledger account not found.')
      }

      const ownerAccountId = command.ownerAccountId ?? actor.accountId
      return this.resolveBalance(
         null,
         command.ownerType,
         ownerAccountId,
         command.accountSubtype,
         command.currency
      )
   }

   private async resolveBalance(
      ledgerAccountId: string | null,
      ownerType: LedgerOwnerType | null,
      ownerAccountId: string | null,
      accountSubtype: string | null,
      currency: string | null
   ): Promise<LedgerBalance> {
      // 1.   Resolve the ledger account ID from parameters
      let accountId = ledgerAccountId

      if (!accountId) {
         if (!ownerType || !accountSubtype || !currency) {
            throw new LedgerAccountNotFoundException(
               'Must provide either ledgerAccountId or ownerType/accountSubtype/currency to retrieve balance.'
            )
         }

         const account = await this.ledgerRepository.findAccount(
            ownerType,
            ownerAccountId,
            accountSubtype,
            currency
         )

         if (!account) {
            // If the account has not been created yet, it has no transactions and thus a balance of 0
            // We get or create it so it is officially registered
            const newAccount = await this.ledgerRepository.getOrCreateAccount(
               ownerType,
               ownerAccountId,
               accountSubtype,
               currency
            )
            return new LedgerBalance(newAccount.id, 0n, new Date())
         }

         accountId = account.id
      }

      // 2.   Retrieve the balance for the resolved ledger account ID
      const balance = await this.ledgerRepository.findBalance(accountId)
      if (!balance) {
         return new LedgerBalance(accountId, 0n, new Date())
      }

      return balance
   }

   private isOwnedBy(account: LedgerAccount, actorAccountId: string): boolean {
      return (
         PERSONAL_OWNER_TYPES.includes(account.ownerType) &&
         account.ownerAccountId === actorAccountId
      )
   }
}
