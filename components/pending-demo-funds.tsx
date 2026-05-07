'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PendingTransfer {
  id: string
  transfer_id: string
  amount: number
  created_at: string
  expires_at: string
  status: string
}

export function PendingDemoFunds() {
  const [pending, setPending] = useState<PendingTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPending, setTotalPending] = useState(0)

  useEffect(() => {
    fetchPendingFunds()
  }, [])

  const fetchPendingFunds = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('account_number')
        .eq('user_id', user.id)
        .eq('is_demo_account', true)
        .single()

      if (!account) {
        setLoading(false)
        return
      }

      const { data: transfers } = await supabase
        .from('demo_transfers')
        .select('*')
        .eq('to_account_number', account.account_number)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (transfers) {
        setPending(transfers)
        setTotalPending(transfers.reduce((sum, t) => sum + t.amount, 0))
      }
    } catch (error) {
      console.error('Error fetching pending funds:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (pending.length === 0) {
    return null
  }

  const daysRemaining = pending[0]?.expires_at
    ? Math.ceil(
        (new Date(pending[0].expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 mb-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
            Pending Demo Funds
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            You have <span className="font-semibold">${totalPending.toFixed(2)}</span> in pending demo funds.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
            These funds will auto-refund to the sender in <span className="font-semibold">{daysRemaining} days</span> if not used.
          </p>

          {/* Pending transfers list */}
          <div className="space-y-2 bg-white dark:bg-slate-800 rounded-lg p-3">
            {pending.map((transfer) => {
              const expiryDate = new Date(transfer.expires_at)
              const formattedDate = expiryDate.toLocaleDateString()
              return (
                <div key={transfer.id} className="flex justify-between items-center text-xs py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{transfer.transfer_id}</p>
                    <p className="text-muted-foreground">Expires: {formattedDate}</p>
                  </div>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    ${transfer.amount.toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 flex gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            Use these funds to test transfers, deposits, and other features!
          </p>
        </div>
      </div>
    </div>
  )
}
