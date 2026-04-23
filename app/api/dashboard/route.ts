/**
 * Dashboard API - Comprehensive banking dashboard data
 * Returns aggregated real-time data for the dashboard view
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/dashboard - Get all dashboard data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [
      accountsResult,
      transactionsResult,
      billsResult,
      notificationsResult,
      creditResult,
      spendingResult
    ] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('bill_payments').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
      supabase.from('notifications').select('*').eq('user_id', userId).limit(5),
      supabase.from('credit_scores').select('*').eq('user_id', userId).single(),
      supabase.from('transactions').select('category, amount').eq('user_id', userId)
    ])

    const accounts = accountsResult.data || []
    const transactions = transactionsResult.data || []
    const bills = billsResult.data || []
    const notifications = notificationsResult.data || []
    const credit = creditResult.data
    const spending = spendingResult.data || []

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const unreadNotifications = notifications.filter(n => !n.is_read).length

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {}
    spending.forEach(tx => {
      if (tx.category) {
        spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount
      }
    })

    // Get upcoming bills this month
    const today = new Date()
    const thisMonth = bills.filter(b => {
      const dueDate = new Date(b.due_date)
      return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()
    })

    const totalDueThisMonth = thisMonth.reduce((sum, b) => sum + b.amount, 0)

    // Get recent transactions
    const recentTransactions = transactions.slice(0, 5)

    // Get quick stats
    const statsLastMonth = transactions.filter(tx => {
      const txDate = new Date(tx.created_at)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return txDate >= lastMonth
    })

    const lastMonthSpending = statsLastMonth
      .filter(tx => tx.type === 'debit' || tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const lastMonthDeposits = statsLastMonth
      .filter(tx => tx.type === 'credit' || tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return NextResponse.json({
      // Account Overview
      accounts: {
        total: accounts.length,
        list: accounts.map(acc => ({
          id: acc.id,
          name: acc.name,
          type: acc.account_type,
          balance: acc.balance,
          availableBalance: acc.available_balance,
          lastDigits: acc.account_number,
          fullAccountNumber: acc.full_account_number,
          routingNumber: acc.routing_number,
        })),
        totalBalance,
        lastSync: new Date().toISOString()
      },

      // Quick Actions
      quickStats: {
        lastMonthSpending,
        lastMonthDeposits,
        averageDailySpending: lastMonthSpending / 30,
        accountsCount: accounts.length,
        billsThisMonth: thisMonth.length,
        totalDueThisMonth
      },

      // Recent Activity
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.created_at
      })),

      // Bills
      bills: {
        total: bills.length,
        dueThisMonth: thisMonth.length,
        totalDueThisMonth,
        upcoming: thisMonth.slice(0, 3).map(b => ({
          id: b.id,
          payee: b.payee,
          amount: b.amount,
          dueDate: b.due_date,
          status: b.status
        }))
      },

      // Spending Analysis
      spending: {
        byCategory: spendingByCategory,
        topCategories: Object.entries(spendingByCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, amount]) => ({ category, amount }))
      },

      // Credit Information
      credit: {
        score: credit?.score || 750,
        status: credit?.status || 'good',
        trend: credit?.trend || 'stable',
        lastUpdated: credit?.updated_at
      },

      // Notifications
      notifications: {
        unread: unreadNotifications,
        recent: notifications.slice(0, 3).map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.is_read,
          category: n.category,
          createdAt: n.created_at
        }))
      },

      // Summary
      summary: {
        accountHealth: 'Good',
        securityStatus: 'Secure',
        alerts: unreadNotifications,
        actionsNeeded: Math.max(0, totalDueThisMonth > 0 ? 1 : 0)
      },

      // Metadata
      lastSync: new Date().toISOString(),
      userId
    })
  } catch (error) {
    console.error('[v0] Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
