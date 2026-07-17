import { createClient } from '@supabase/supabase-js'
import {
  AccountBalance,
  BalanceTransaction,
  TransferRequest,
  BalanceAlert,
} from './balance-types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Initialize or get account balance
export async function getOrCreateBalance(
  accountId: string,
  initialBalance: number = 0
): Promise<AccountBalance> {
  try {
    const { data, error } = await supabase
      .from('account_balances')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Balance doesn't exist, create it
      const newBalance: AccountBalance = {
        accountId,
        available: initialBalance,
        pending: 0,
        reserved: 0,
        total: initialBalance,
        currency: 'USD',
        lastUpdated: new Date(),
      }

      const { error: insertError } = await supabase
        .from('account_balances')
        .insert([
          {
            account_id: accountId,
            available: initialBalance,
            pending: 0,
            reserved: 0,
            total: initialBalance,
            currency: 'USD',
            last_updated: new Date(),
          },
        ])

      if (insertError) throw insertError
      return newBalance
    }

    if (error) throw error

    return {
      accountId: data.account_id,
      available: data.available,
      pending: data.pending,
      reserved: data.reserved,
      total: data.total,
      currency: data.currency,
      lastUpdated: new Date(data.last_updated),
    }
  } catch (error) {
    console.error('[v0] Error getting balance:', error)
    throw error
  }
}

// Record transaction
export async function recordTransaction(
  transaction: Omit<BalanceTransaction, 'id' | 'createdAt'>
): Promise<BalanceTransaction> {
  try {
    const { data, error } = await supabase
      .from('balance_transactions')
      .insert([
        {
          account_id: transaction.accountId,
          type: transaction.type,
          amount: transaction.amount,
          balance_before: transaction.balanceBefore,
          balance_after: transaction.balanceAfter,
          description: transaction.description,
          related_id: transaction.relatedId,
          status: transaction.status,
          metadata: transaction.metadata,
          created_at: new Date(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      accountId: data.account_id,
      type: data.type,
      amount: data.amount,
      balanceBefore: data.balance_before,
      balanceAfter: data.balance_after,
      description: data.description,
      relatedId: data.related_id,
      status: data.status,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    }
  } catch (error) {
    console.error('[v0] Error recording transaction:', error)
    throw error
  }
}

// Transfer funds between accounts
export async function transferFunds(
  request: TransferRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Get both account balances
    const fromBalance = await getOrCreateBalance(request.fromAccountId)
    const toBalance = await getOrCreateBalance(request.toAccountId)

    // Check if sender has sufficient balance
    if (fromBalance.available < request.amount) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${fromBalance.available}, Requested: ${request.amount}`,
      }
    }

    // Deduct from source account
    const { error: updateFromError } = await supabase
      .from('account_balances')
      .update({
        available: fromBalance.available - request.amount,
        total: fromBalance.total - request.amount,
        last_updated: new Date(),
      })
      .eq('account_id', request.fromAccountId)

    if (updateFromError) throw updateFromError

    // Add to destination account
    const { error: updateToError } = await supabase
      .from('account_balances')
      .update({
        available: toBalance.available + request.amount,
        total: toBalance.total + request.amount,
        last_updated: new Date(),
      })
      .eq('account_id', request.toAccountId)

    if (updateToError) throw updateToError

    // Record transaction for source
    const fromTxn = await recordTransaction({
      accountId: request.fromAccountId,
      type: 'transfer',
      amount: -request.amount,
      balanceBefore: fromBalance.available,
      balanceAfter: fromBalance.available - request.amount,
      description: `Transfer to ${request.toAccountId}: ${request.description}`,
      relatedId: `transfer_${Date.now()}`,
      status: 'completed',
      metadata: request.metadata,
    })

    // Record transaction for destination
    await recordTransaction({
      accountId: request.toAccountId,
      type: 'transfer',
      amount: request.amount,
      balanceBefore: toBalance.available,
      balanceAfter: toBalance.available + request.amount,
      description: `Transfer from ${request.fromAccountId}: ${request.description}`,
      relatedId: `transfer_${Date.now()}`,
      status: 'completed',
      metadata: request.metadata,
    })

    return {
      success: true,
      transactionId: fromTxn.id,
    }
  } catch (error) {
    console.error('[v0] Error transferring funds:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    }
  }
}

// Update balance on charge
export async function updateBalanceOnCharge(
  accountId: string,
  chargeId: string,
  amount: number,
  status: 'completed' | 'pending' | 'failed'
): Promise<void> {
  try {
    const balance = await getOrCreateBalance(accountId)

    let updatedBalance = balance.available
    if (status === 'pending') {
      updatedBalance = balance.available - amount
    } else if (status === 'completed') {
      updatedBalance = balance.available + amount
    }

    await supabase
      .from('account_balances')
      .update({
        available: updatedBalance,
        total: balance.total + (status !== 'failed' ? amount : 0),
        last_updated: new Date(),
      })
      .eq('account_id', accountId)

    await recordTransaction({
      accountId,
      type: 'charge',
      amount,
      balanceBefore: balance.available,
      balanceAfter: updatedBalance,
      description: `Charge ${status}: ${chargeId}`,
      relatedId: chargeId,
      status: status === 'failed' ? 'failed' : 'completed',
    })
  } catch (error) {
    console.error('[v0] Error updating balance on charge:', error)
    throw error
  }
}

// Get transaction history
export async function getTransactionHistory(
  accountId: string,
  limit: number = 50,
  offset: number = 0
): Promise<BalanceTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (data || []).map((txn) => ({
      id: txn.id,
      accountId: txn.account_id,
      type: txn.type,
      amount: txn.amount,
      balanceBefore: txn.balance_before,
      balanceAfter: txn.balance_after,
      description: txn.description,
      relatedId: txn.related_id,
      status: txn.status,
      metadata: txn.metadata,
      createdAt: new Date(txn.created_at),
    }))
  } catch (error) {
    console.error('[v0] Error fetching transaction history:', error)
    throw error
  }
}

// Create balance alert
export async function createBalanceAlert(
  accountId: string,
  type: 'low_balance' | 'large_transfer' | 'unusual_activity',
  message: string,
  threshold?: number
): Promise<BalanceAlert> {
  try {
    const { data, error } = await supabase
      .from('balance_alerts')
      .insert([
        {
          account_id: accountId,
          type,
          threshold,
          message,
          read: false,
          created_at: new Date(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      accountId: data.account_id,
      type: data.type,
      threshold: data.threshold,
      message: data.message,
      read: data.read,
      createdAt: new Date(data.created_at),
    }
  } catch (error) {
    console.error('[v0] Error creating balance alert:', error)
    throw error
  }
}
