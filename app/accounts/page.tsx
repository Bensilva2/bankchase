'use client';

import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useDemoBalance } from '@/hooks/useDemoFunds';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AccountsPage() {
  const { accounts, totalBalance, isLoading } = useAccounts();
  const { transactions } = useTransactions(undefined, 10);
  const { balance: demoBalance } = useDemoBalance();

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Accounts</h1>
          <p className="text-muted-foreground">Manage your accounts and view transactions</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <p className="text-white/80 mb-2 text-sm font-medium">Total Balance</p>
          <h2 className="text-5xl font-bold mb-6">
            ${totalBalance.toFixed(2)}
          </h2>
          <div className="flex justify-between items-end">
            <div className="flex gap-4">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                Send Money
              </button>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                Request
              </button>
            </div>
            <TrendingUp className="w-6 h-6 opacity-50" />
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">Your Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {account.account_type}
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {account.account_number}
                        </p>
                      </div>
                      <Wallet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${account.balance.toFixed(2)}
                      </p>
                      {account.is_demo_account && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">Demo Account</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No accounts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Demo Balance Section */}
        {demoBalance > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Demo Funds</h3>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Available Demo Balance</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    ${demoBalance.toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl opacity-20">💰</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-foreground">Recent Transactions</h3>
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.type === 'credit'
                          ? 'bg-green-100 dark:bg-green-950'
                          : 'bg-red-100 dark:bg-red-950'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className={`w-5 h-5 text-green-600 dark:text-green-400`} />
                      ) : (
                        <ArrowUpRight className={`w-5 h-5 text-red-600 dark:text-red-400`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
