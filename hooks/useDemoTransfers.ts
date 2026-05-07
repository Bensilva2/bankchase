import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PendingTransfer {
  id: string
  transfer_id: string
  amount: number
  created_at: string
  expires_at: string
  status: 'pending' | 'completed' | 'refunded'
}

interface AdminDemoAccount {
  id: string
  account_number: string
  balance: number
  user_id: string | null
  is_demo_account: boolean
}

export function useDemoTransfers() {
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([])
  const [adminAccount, setAdminAccount] = useState<AdminDemoAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPendingTransfers = async (userId?: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Get current user if not provided
      let targetUserId = userId
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        targetUserId = user?.id
      }

      if (!targetUserId) return

      // Get user's account
      const { data: account } = await supabase
        .from('accounts')
        .select('account_number')
        .eq('user_id', targetUserId)
        .eq('is_demo_account', true)
        .single()

      if (!account) {
        setPendingTransfers([])
        return
      }

      // Get pending transfers
      const { data: transfers, error: transferError } = await supabase
        .from('demo_transfers')
        .select('*')
        .eq('to_account_number', account.account_number)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (transferError) throw transferError

      setPendingTransfers(transfers || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching pending transfers:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminBalance = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: account, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_demo_account', true)
        .single()

      if (error) {
        console.warn('No admin account found:', error)
        return
      }

      setAdminAccount(account)
    } catch (err: any) {
      console.error('Error fetching admin account:', err)
    }
  }

  const sendDemoTransfer = async (
    toAccountNumber: string,
    amount: number,
    daysToRefund = 7
  ) => {
    try {
      const response = await fetch('/api/admin/demo-transfer/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_account_number: toAccountNumber,
          amount,
          days_to_refund: daysToRefund,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transfer failed')
      }

      const data = await response.json()
      
      // Refresh pending transfers
      fetchPendingTransfers()
      
      // Refresh admin balance
      fetchAdminBalance()

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const sendBulkTransfer = async (amount: number, daysToRefund = 7) => {
    try {
      const response = await fetch('/api/admin/demo-transfer/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          days_to_refund: daysToRefund,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Bulk transfer failed')
      }

      const data = await response.json()
      
      // Refresh admin balance
      fetchAdminBalance()

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const getTotalPending = () => {
    return pendingTransfers.reduce((sum, t) => sum + t.amount, 0)
  }

  const getDaysUntilRefund = () => {
    if (pendingTransfers.length === 0) return 0
    const firstExpiry = new Date(pendingTransfers[0].expires_at).getTime()
    const now = Date.now()
    return Math.ceil((firstExpiry - now) / (1000 * 60 * 60 * 24))
  }

  useEffect(() => {
    fetchPendingTransfers()
    fetchAdminBalance()
  }, [])

  return {
    pendingTransfers,
    adminAccount,
    isLoading,
    error,
    sendDemoTransfer,
    sendBulkTransfer,
    getTotalPending,
    getDaysUntilRefund,
    refreshPendingTransfers: fetchPendingTransfers,
    refreshAdminBalance: fetchAdminBalance,
  }
}
