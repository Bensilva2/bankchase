'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TransactionStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  amount: number
  currency: string
  progress: {
    percent: number
    message: string
    stage: string
  }
  failureReason?: string
  elapsedSeconds?: number
}

interface TransactionMonitorProps {
  transactionId: string
  onStatusChange?: (status: TransactionStatus) => void
  autoClose?: boolean
  autoCloseDuration?: number
}

export default function TransactionMonitor({
  transactionId,
  onStatusChange,
  autoClose = true,
  autoCloseDuration = 5000
}: TransactionMonitorProps) {
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  // Poll for status updates
  useEffect(() => {
    if (!isVisible) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/transfers/status?transactionId=${transactionId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Transaction not found')
            return
          }
          throw new Error('Failed to fetch status')
        }

        const data = await response.json()
        const status = data.transaction

        setTransaction({
          id: status.id,
          status: status.status,
          amount: status.amount,
          currency: status.currency,
          progress: data.progress,
          failureReason: status.failureReason,
          elapsedSeconds: status.elapsedSeconds
        })

        setError(null)
        setLoading(false)

        // Notify parent component
        onStatusChange?.(status)

        // Auto-close on completion
        if (autoClose && (status.status === 'completed' || status.status === 'failed')) {
          setTimeout(() => setIsVisible(false), autoCloseDuration)
        }
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    // Initial poll
    poll()

    // Continue polling every 5 seconds while processing
    const interval = setInterval(() => {
      if (transaction?.status === 'processing' || transaction?.status === 'pending') {
        poll()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [transactionId, isVisible, autoClose, autoCloseDuration, onStatusChange])

  if (!isVisible) return null

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            <span className="text-sm text-muted-foreground">Loading transaction status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !transaction) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-red-600">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error || 'Transaction not found'}</p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              ✕
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusStyles: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: '⏳' },
    processing: { bg: 'bg-background', text: 'text-blue-800', icon: '⚙️' },
    completed: { bg: 'bg-green-50', text: 'text-green-800', icon: '✓' },
    failed: { bg: 'bg-red-50', text: 'text-red-800', icon: '✕' }
  }

  const style = statusStyles[transaction.status]

  return (
    <Card className={`w-full ${style.bg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">{style.icon}</span>
            Transfer {transaction.status === 'completed' ? 'Completed' : transaction.status === 'failed' ? 'Failed' : 'Processing'}
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className={`text-sm font-medium ${style.text}`}
          >
            ✕
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount and Details */}
        <div className="space-y-2">
          <p className="text-2xl font-bold">
            {transaction.currency} {transaction.amount.toFixed(2)}
          </p>
          <p className={`text-sm ${style.text}`}>
            {transaction.progress.message}
          </p>
        </div>

        {/* Progress Bar */}
        {transaction.status !== 'failed' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{transaction.progress.percent}%</span>
            </div>
            <div className="w-full bg-card rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${transaction.progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Failure Reason */}
        {transaction.status === 'failed' && transaction.failureReason && (
          <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
            {transaction.failureReason}
          </div>
        )}

        {/* Transaction ID and Elapsed Time */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>ID: {transaction.id.slice(0, 8)}...</span>
          <span>{transaction.elapsedSeconds}s elapsed</span>
        </div>
      </CardContent>
    </Card>
  )
}
