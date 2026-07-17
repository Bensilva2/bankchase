// Balance types and interfaces for account balance tracking
export interface AccountBalance {
  accountId: string
  available: number // Amount available for transfers/withdrawals
  pending: number // Amount waiting to be settled
  reserved: number // Amount reserved for ongoing transactions
  total: number // Total balance (available + pending + reserved)
  currency: string
  lastUpdated: Date
}

export interface BalanceTransaction {
  id: string
  accountId: string
  type: 'charge' | 'transfer' | 'payout' | 'refund' | 'adjustment'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  relatedId: string // charge_id, transfer_id, payout_id, etc.
  status: 'completed' | 'pending' | 'failed'
  metadata?: Record<string, any>
  createdAt: Date
}

export interface TransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  description: string
  metadata?: Record<string, any>
}

export interface BalanceAlert {
  id: string
  accountId: string
  type: 'low_balance' | 'large_transfer' | 'unusual_activity'
  threshold?: number
  message: string
  read: boolean
  createdAt: Date
}
