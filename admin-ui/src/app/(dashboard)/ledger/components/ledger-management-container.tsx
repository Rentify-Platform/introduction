'use client'

import * as React from 'react'
import { ListOrdered, Wallet, Banknote, Settings2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LedgerFilterBar } from '@/features/ledger/components/ledger-filter-bar'
import { TransactionsTable } from '@/features/ledger/components/transactions-table'
import { BalancesTable } from '@/features/ledger/components/balances-table'
import { PayoutsTable } from '@/features/ledger/components/payouts-table'
import { PlatformConfigForm } from '@/features/ledger/components/platform-config-form'
import { useLedgerMutations } from '@/features/ledger/hooks/use-ledger-mutations'
import {
   useBalanceQueries,
   usePayoutQueries,
   usePlatformConfigQuery,
   useTransactionQueries
} from '@/features/ledger/hooks/use-ledger-queries'
import { LedgerTab, PayoutsFilter, TransactionsFilter } from '@/features/ledger/types'

export function LedgerManagementContainer() {
   const [tab, setTab] = React.useState<LedgerTab>('transactions')

   const [txnFilter, setTxnFilter] = React.useState<TransactionsFilter>({ page: 1, limit: 20 })
   const [payoutFilter, setPayoutFilter] = React.useState<PayoutsFilter>({ page: 1, limit: 20 })

   const transactions = useTransactionQueries(txnFilter)
   const balances = useBalanceQueries()
   const payouts = usePayoutQueries(payoutFilter)
   const platformConfig = usePlatformConfigQuery()
   const { updateConfig, isUpdatingConfig } = useLedgerMutations()

   return (
      <div className="space-y-4">
         <Tabs
            value={tab}
            onValueChange={(value) => setTab((value as LedgerTab) ?? 'transactions')}
         >
            <TabsList className="h-auto rounded-xl border border-zinc-200 bg-white p-1">
               <TabsTrigger value="transactions" className="gap-1.5 px-4 py-1.5 text-zinc-600">
                  <ListOrdered className="h-4 w-4" />
                  Transactions
               </TabsTrigger>
               <TabsTrigger value="balances" className="gap-1.5 px-4 py-1.5 text-zinc-600">
                  <Wallet className="h-4 w-4" />
                  Balances
               </TabsTrigger>
               <TabsTrigger value="payouts" className="gap-1.5 px-4 py-1.5 text-zinc-600">
                  <Banknote className="h-4 w-4" />
                  Payouts
               </TabsTrigger>
               <TabsTrigger value="settings" className="gap-1.5 px-4 py-1.5 text-zinc-600">
                  <Settings2 className="h-4 w-4" />
                  Settings
               </TabsTrigger>
            </TabsList>
         </Tabs>

         {tab === 'transactions' && (
            <div className="space-y-4">
               <LedgerFilterBar filter={txnFilter} onChange={setTxnFilter} />
               <TransactionsTable
                  transactions={transactions.transactions}
                  total={transactions.total}
                  filter={txnFilter}
                  isLoading={transactions.isLoading}
                  isFetching={transactions.isFetching}
                  error={transactions.error}
                  onFilterChange={setTxnFilter}
               />
            </div>
         )}

         {tab === 'balances' && (
            <BalancesTable
               balances={balances.balances}
               isLoading={balances.isLoading}
               isFetching={balances.isFetching}
               error={balances.error}
               onRefetch={() => void balances.refetch()}
            />
         )}

         {tab === 'payouts' && (
            <PayoutsTable
               payouts={payouts.payouts}
               total={payouts.total}
               filter={payoutFilter}
               isLoading={payouts.isLoading}
               isFetching={payouts.isFetching}
               error={payouts.error}
               onFilterChange={setPayoutFilter}
            />
         )}

         {tab === 'settings' && (
            <PlatformConfigForm
               config={platformConfig.config}
               isLoading={platformConfig.isLoading}
               error={platformConfig.error}
               onUpdate={(feeRules) => updateConfig(feeRules)}
               isUpdating={isUpdatingConfig}
            />
         )}
      </div>
   )
}
