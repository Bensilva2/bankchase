'use client';

import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useDemoBalance } from '@/hooks/useDemoFunds';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function AccountsContent() {
  const { accounts, totalBalance, isLoading } = useAccounts();
  const { transactions } = useTransactions(undefined, 10);
  const { balance: demoBalance } = useDemoBalance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Accounts</h1>
          <p className="text-muted-foreground">Manage and view all your banking accounts</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <p className="text-white/80 mb-2 text-sm font-medium">Total Balance</p>
          <h2 className="text-5xl font-bold mb-6">
            ${totalBalance.toFixed(2)}
          </h2>
          <div className="flex justify-between items-end">
            <div className="flex gap-3">
              <Link href="/pay-transfer" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium">
                Send Money
              </Link>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium">
                Request Money
              </button>
            </div>
            <TrendingUp className="w-6 h-6 opacity-50" />
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-foreground">Your Accounts</h3>
            <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition text-sm font-medium">
              + Add Account
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="group cursor-pointer"
                >
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 capitalize font-medium">
                          {account.account_type}
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          **** {account.account_number.slice(-4)}
                        </p>
                      </div>
                      <Wallet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${account.balance.toFixed(2)}
                        </p>
                      </div>
                      {account.is_demo_account && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Demo Account</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-2">No accounts found</p>
                <p className="text-sm text-muted-foreground">Create your first account to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Details Modal */}
        {selectedAccount && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:p-0"
            onClick={() => setSelectedAccountId(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 capitalize">
                    {selectedAccount.account_type} Account
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedAccount.account_number}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAccountId(null)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${selectedAccount.balance.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Account Type</p>
                    <p className="font-semibold text-foreground capitalize">
                      {selectedAccount.account_type}
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Status</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">Active</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/accounts/${selectedAccount.id}`}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition font-medium text-center"
                >
                  View Details
                </Link>
                <button
                  onClick={() => setSelectedAccountId(null)}
                  className="flex-1 bg-background border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Balance Section */}
        {demoBalance > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Demo Funds</h3>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-1 font-medium">Available Demo Balance</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    ${demoBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Use this balance to test transfers</p>
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
            <Link href="/transactions" className="text-sm text-primary hover:text-primary/80 transition font-medium">
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
                        {format(new Date(tx.date || tx.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <AccountsContent />
    </ProtectedRoute>
  );
}
