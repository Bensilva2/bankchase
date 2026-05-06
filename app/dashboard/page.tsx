'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import { useFetch } from '../../lib/useFetch'
import { BalanceCardSkeleton, CardSkeleton } from '../../components/loading-skeletons'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import {
  Send,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'

interface Account {
  id: string
  account_number: string
  account_type: string
  balance: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const { accounts: newAccounts = [], totalBalance, isLoading: accountsLoading } = useAccounts()
  const { transactions = [] } = useTransactions(undefined, 5)

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return []
    return transactions.slice(0, 5)
  }, [transactions])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Welcome Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.first_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground">Here&apos;s your financial overview</p>
        </div>

        {/* Total Balance Card */}
        {accountsLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl shadow-lg p-8 mb-8">
            <p className="text-white/80 mb-2 text-sm font-medium">Total Balance</p>
            <h2 className="text-5xl font-bold mb-6">
              ${totalBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <div className="flex justify-between items-end">
              <div className="flex gap-3">
                <Link
                  href="/pay-transfer"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Money
                </Link>
                <Link
                  href="/accounts"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </Link>
              </div>
              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/pay-transfer" className="group">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">Send Money</p>
            </div>
          </Link>

          <Link href="/accounts" className="group">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">View Cards</p>
            </div>
          </Link>

          <Link href="/transactions" className="group">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">Transactions</p>
            </div>
          </Link>

          <Link href="/offers" className="group">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">Special Offers</p>
            </div>
          </Link>
        </div>

        {/* Accounts Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Your Accounts</h2>
            <Link
              href="/accounts"
              className="text-sm text-primary hover:text-primary/80 transition font-medium"
            >
              View All
            </Link>
          </div>

          {accountsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : newAccounts && newAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newAccounts.slice(0, 3).map((account) => (
                <Link key={account.id} href={`/accounts/${account.id}`} className="group">
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 capitalize">
                          {account.account_type}
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {account.account_number}
                        </p>
                      </div>
                      <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${account.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No accounts found</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Transactions</h2>
            <Link
              href="/transactions"
              className="text-sm text-primary hover:text-primary/80 transition font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-background/50 rounded-lg transition"
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
                        <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
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
                      tx.type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
