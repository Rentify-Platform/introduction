import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common'
import {
   GetBalanceUseCase,
   GetBalanceCommand
} from '../../application/use-cases/get-balance.usecase'
import {
   PostTransactionUseCase,
   PostTransactionCommand,
   PostTransactionEntryCommand
} from '../../application/use-cases/post-transaction.usecase'
import { GetBalanceQueryRequest } from '../requests/get-balance-query.request'
import { PostTransactionRequest } from '../requests/post-transaction.request'
import { LedgerMapper } from '../mappers/ledger.mapper'
import { ApiResponse } from '../../../../shared/response/api-response'
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard'
import { CurrentUser, AuthenticatedUser } from '../../../auth/presentation/current-user.decorator'
import { LedgerOwnerType } from '../../domain/entities/ledger-account.entity'
import { LedgerTxnType } from '../../domain/entities/ledger-transaction.entity'

@Controller('ledger')
export class LedgerController {
   constructor(
      private readonly getBalanceUseCase: GetBalanceUseCase,
      private readonly postTransactionUseCase: PostTransactionUseCase
   ) {}

   @Get('accounts/balance')
   @UseGuards(JwtAuthGuard)
   async getBalance(@Query() query: GetBalanceQueryRequest) {
      const command = new GetBalanceCommand(
         query.ledgerAccountId || null,
         (query.ownerType as LedgerOwnerType) || null,
         query.ownerAccountId || null,
         query.accountSubtype || null,
         query.currency || null
      )
      const balance = await this.getBalanceUseCase.execute(command)
      return ApiResponse.success(
         LedgerMapper.toBalanceResponse(balance),
         'Balance retrieved successfully'
      )
   }

   @Post('transactions')
   @UseGuards(JwtAuthGuard)
   async postTransaction(
      @CurrentUser() user: AuthenticatedUser,
      @Body() request: PostTransactionRequest
   ) {
      const entryCommands = request.entries.map(
         (e) =>
            new PostTransactionEntryCommand(
               e.ledgerAccountId || null,
               (e.ownerType as LedgerOwnerType) || null,
               e.ownerAccountId || null,
               e.accountSubtype || null,
               BigInt(e.amountCents),
               e.currency
            )
      )

      const command = new PostTransactionCommand(
         request.idempotencyKey,
         request.type as LedgerTxnType,
         request.bookingId || null,
         request.description || null,
         request.metadata || null,
         user.id,
         entryCommands
      )

      const txn = await this.postTransactionUseCase.execute(command)
      return ApiResponse.success(
         LedgerMapper.toTransactionResponse(txn),
         'Transaction posted successfully'
      )
   }
}
