'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/lib/realtime-context'
import { useAccountManagement } from '@/hooks/use-account-management'
import { useTransactionHistory } from '@/hooks/use-transaction-history'
import Image from 'next/image'
import {
  CreditCard,
  Send,
  Wallet,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react'

export function IntegratedFinancialDashboard() {
  const { data: realtimeData, isConnected, isLoading, subscribeToUpdates, unsubscribeFromUpdates } = useRealtime()
  const { accounts, loading: accountsLoading, fetchAccounts, makeTransfer } = useAccountManagement()
  const { transactions, loading: transactionsLoading, fetchTransactions } = useTransactionHistory()
  const [hideBalances, setHideBalances] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  // Initialize data
  useEffect(() => {
    const userId = localStorage.getItem('user_id')
    if (userId) {
      subscribeToUpdates(userId)
      fetchAccounts()
      fetchTransactions()
    }

    return () => {
      unsubscribeFromUpdates()
    }
  }, [subscribeToUpdates, unsubscribeFromUpdates, fetchAccounts, fetchTransactions])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      fetchAccounts()
      fetchTransactions()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, fetchAccounts, fetchTransactions])

  const totalBalance = useCallback(() => {
    return (accounts || []).reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }, [accounts])

  const recentTransactions = useCallback(() => {
    return (transactions || []).slice(0, 5)
  }, [transactions])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <Send className="w-4 h-4" />
      case 'deposit':
        return <Wallet className="w-4 h-4" />
      case 'withdrawal':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image src="/images/chase-logo.png" alt="Banking" width={40} height={40} className="rounded-lg" />
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAccounts()
                fetchTransactions()
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Real-time synchronization is currently offline. Auto-refreshing every 5 seconds.
            </p>
          </div>
        )}

        {/* Total Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-blue-100 mb-2 text-sm">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {hideBalances ? '••••' : `$${totalBalance().toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideBalances(!hideBalances)}
                  className="text-blue-100 hover:text-white hover:bg-blue-700"
                >
                  {hideBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                <Wallet className="w-4 h-4 mr-2" />
                Request
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-400">
            <div>
              <p className="text-blue-100 text-xs uppercase">Accounts</p>
              <p className="text-xl font-bold">{accounts?.length || 0}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase">Status</p>
              <p className="text-xl font-bold">Active</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase">Sync Status</p>
              <p className="text-xl font-bold">{isConnected ? 'Live' : 'Pending'}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Accounts Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Accounts</h2>
              <Button variant="ghost" size="sm" className="text-blue-600">
                + Add Account
              </Button>
            </div>
            <div className="space-y-3">
              {(accounts || []).map((account) => (
                <Card
                  key={account.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAccount === account.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{account.name || 'Checking'}</p>
                        <p className="text-xs text-gray-500">•••• {account.last4 || '1234'}</p>
                      </div>
                    </div>
                    {account.is_primary && (
                      <Badge className="bg-blue-100 text-blue-800 border-0">Primary</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-bold text-gray-900">
                      {hideBalances ? '••••' : `$${(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </p>
                    <Badge
                      className={getStatusColor(account.status || 'active')}
                      variant="outline"
                    >
                      {account.status || 'Active'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {(recentTransactions() || []).map((transaction) => (
                <Card key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.type === 'withdrawal'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <Badge
                        className={getStatusColor(transaction.status)}
                        variant="outline"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-between items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh every 5 seconds</span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </Button>
            <Button variant="destructive" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
