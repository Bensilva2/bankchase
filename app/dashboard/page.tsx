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
      <div className="min-h-screen flex items-center justify-center bg-white">
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

  const today = new Date()
  const dateStr = format(today, 'MMMM dd, yyyy')

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 md:pb-0">
      {/* Mobile Status Bar */}
      <div className="bg-white px-4 py-2 flex justify-between items-center text-xs text-foreground border-b border-border sticky top-0 z-40">
        <span className="font-medium">No SIM</span>
        <span className="font-semibold">{format(today, 'h:mm a')}</span>
        <span>@ 3% 🔋</span>
      </div>

      {/* Mobile Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-border">
        <button className="p-2 hover:bg-muted rounded-full transition">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* Chase Logo */}
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
        </div>

        <Link href="/settings" className="p-2 hover:bg-muted rounded-full transition">
          <User className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-1">Good morning</h1>
          <p className="text-muted-foreground text-sm">{dateStr}</p>
        </div>

        {/* Quick Actions - Horizontal Scroll */}
        <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3 w-max">
            <Link
              href="/pay-transfer"
              className="px-6 py-3 bg-white border border-border rounded-full whitespace-nowrap font-medium text-primary hover:border-primary transition"
            >
              <span className="text-lg mr-2">+</span>
            </Link>
            
            <Link
              href="/pay-transfer"
              className="px-6 py-3 bg-white border border-border rounded-full whitespace-nowrap font-medium text-foreground hover:border-primary transition"
            >
              Send | Zelle®
            </Link>

            <Link
              href="/mobile-deposit"
              className="px-6 py-3 bg-white border border-border rounded-full whitespace-nowrap font-medium text-foreground hover:border-primary transition"
            >
              Deposit checks
            </Link>

            <Link
              href="/pay-transfer"
              className="px-6 py-3 bg-white border border-border rounded-full whitespace-nowrap font-medium text-foreground hover:border-primary transition"
            >
              Pay bills
            </Link>
          </div>
        </div>

        {/* Snapshot Card */}
        <div className="mb-8 p-5 bg-white border border-border rounded-2xl hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground mb-1">Snapshot</h3>
              <p className="text-xs text-muted-foreground">30 sec read</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4 p-3 bg-primary/10 rounded-lg mb-4">
            <div className="text-3xl font-bold text-primary">💳</div>
          </div>
          <p className="text-foreground text-sm">
            Your card usage is <span className="font-semibold">$0</span> this week.
          </p>
        </div>

        {/* Accounts Section */}
        {accountsLoading ? (
          <CardSkeleton />
        ) : newAccounts && newAccounts.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Accounts</h2>
              <button className="p-2 hover:bg-muted rounded-full transition">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Account Card */}
            <div className="bg-primary text-white rounded-2xl p-6 mb-4 shadow-md">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-white/80 text-sm font-medium">Bank accounts (1)</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/70 text-sm mb-2">
                  {newAccounts[0].account_type.toUpperCase()} (...{newAccounts[0].account_number.slice(-2)})
                </p>
                <h3 className="text-5xl font-bold text-white mb-1">
                  ${newAccounts[0].balance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
                <p className="text-white/70 text-sm">Available balance</p>
              </div>

              <Link
                href="/settings/connected-accounts"
                className="text-white font-medium flex items-center gap-2 hover:opacity-90 transition"
              >
                Link external accounts
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : null}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-foreground">Recent</h2>
              <Link href="/transactions" className="text-xs text-primary hover:text-primary/80 font-medium">
                See all
              </Link>
            </div>
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-white border border-border rounded-lg hover:bg-muted transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'credit'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.date || tx.created_at), 'MMM d')}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-semibold text-sm ${
                    tx.type === 'credit'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex justify-around md:hidden">
        <Link href="/accounts" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition text-center">
          <CreditCard className="w-6 h-6 text-primary" />
          <span className="text-xs text-primary font-medium">Accounts</span>
        </Link>
        
        <Link href="/pay-transfer" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition text-center">
          <Send className="w-6 h-6" />
          <span className="text-xs font-medium">Pay & transfer</span>
        </Link>

        <Link href="/analytics" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition text-center">
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium">Plan & track</span>
        </Link>

        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition text-center">
          <Menu className="w-6 h-6" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </div>
  )
}
