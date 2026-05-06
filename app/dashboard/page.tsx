'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { useFetch } from '../../lib/useFetch'
import { BalanceCardSkeleton, CardSkeleton } from '../../components/loading-skeletons'

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
  const { data: accounts, loading: accountsLoading } = useFetch<Account[]>(
    isAuthenticated ? '/api/accounts' : null,
    { cache: true, cacheTime: 2 * 60 * 1000 }
  )

  // Calculate total balance
  const totalBalance = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) return 0
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0)
  }, [accounts])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chase</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.first_name || user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Total Balance Card */}
        {accountsLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
            <p className="text-blue-100 mb-2">Total Balance</p>
            <h2 className="text-5xl font-bold">
              ${totalBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
          </div>
        )}

        {/* Accounts Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Accounts</h3>

          {accountsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : accounts && Array.isArray(accounts) && accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm capitalize">
                        {account.account_type}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {account.account_number}
                      </p>
                    </div>
                    {!account.is_active && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-semibold">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${account.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {account.currency}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-500">No accounts found</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Send Money', icon: '💳', color: 'blue' },
            { title: 'Pay Bills', icon: '📋', color: 'green' },
            { title: 'View Offers', icon: '🎁', color: 'purple' },
            { title: 'Download Statements', icon: '📄', color: 'orange' },
          ].map((action) => (
            <button
              key={action.title}
              className="bg-white hover:shadow-lg rounded-lg shadow p-4 transition text-center"
            >
              <p className="text-3xl mb-2">{action.icon}</p>
              <p className="text-gray-700 font-semibold text-sm">{action.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
