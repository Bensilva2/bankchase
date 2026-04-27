// Seed data for realistic account balances and transactions
import type { Account, Transaction } from '@/lib/banking-context'

export function getSeededAccounts(): Account[] {
  return [
    {
      id: '1',
      name: 'Total Checking',
      type: 'checking',
      balance: 15847.23,
      accountNumber: '****0683',
      routingNumber: '021000021',
      interestRate: 0.01,
    },
    {
      id: '2',
      name: 'Chase Savings',
      type: 'savings',
      balance: 52340.89,
      accountNumber: '****4521',
      routingNumber: '021000021',
      interestRate: 4.0,
    },
    {
      id: '3',
      name: 'Sapphire Reserve',
      type: 'credit',
      balance: 3247.56,
      accountNumber: '****8901',
      routingNumber: '',
      interestRate: 21.99,
    },
    {
      id: '4',
      name: 'Freedom Unlimited',
      type: 'credit',
      balance: 1520.33,
      accountNumber: '****7823',
      routingNumber: '',
      interestRate: 19.99,
    },
  ]
}

export function getSeededTransactions(): Transaction[] {
  const now = new Date()

  return [
    {
      id: 'tx1',
      description: 'Payroll Deposit - Tech Corp Inc',
      amount: 8750.0,
      date: now.toISOString(),
      type: 'credit',
      category: 'Income',
      status: 'completed',
      reference: 'PAY-2024-1201',
      accountId: '1',
    },
    {
      id: 'tx2',
      description: 'Electric Bill - Con Edison',
      amount: 187.45,
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Bills & Utilities',
      status: 'completed',
      reference: 'UTIL-CE-8821',
      accountId: '1',
    },
    {
      id: 'tx3',
      description: 'Amazon Purchase',
      amount: 156.99,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Shopping',
      status: 'completed',
      reference: 'AMZ-11294732',
      accountId: '3',
    },
    {
      id: 'tx4',
      description: 'Netflix Subscription',
      amount: 22.99,
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Entertainment',
      status: 'completed',
      reference: 'NFLX-MONTHLY',
      accountId: '3',
    },
    {
      id: 'tx5',
      description: 'Gas Station - Shell',
      amount: 65.42,
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Transportation',
      status: 'completed',
      reference: 'SHELL-89921',
      accountId: '1',
    },
    {
      id: 'tx6',
      description: 'Grocery Store - Whole Foods',
      amount: 234.87,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Food & Drink',
      status: 'completed',
      reference: 'WF-442891',
      accountId: '1',
    },
    {
      id: 'tx7',
      description: 'Restaurant - Olive Garden',
      amount: 87.50,
      date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Dining',
      status: 'completed',
      reference: 'OG-123456',
      accountId: '3',
    },
    {
      id: 'tx8',
      description: 'ATM Withdrawal',
      amount: 200.0,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Cash',
      status: 'completed',
      reference: 'ATM-CHASE-123',
      accountId: '1',
    },
    {
      id: 'tx9',
      description: 'Transfer to Savings',
      amount: 1000.0,
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      category: 'Transfers',
      status: 'completed',
      reference: 'TRF-INTERNAL-001',
      accountId: '1',
      accountFrom: '1',
      accountTo: '2',
    },
    {
      id: 'tx10',
      description: 'Interest Credit',
      amount: 45.23,
      date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'credit',
      category: 'Interest',
      status: 'completed',
      reference: 'INT-MONTHLY-001',
      accountId: '2',
    },
  ]
}

export function seedAccountBalances() {
  // This function can be called to reset/reinitialize balances
  return getSeededAccounts()
}
