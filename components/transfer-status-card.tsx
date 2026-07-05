'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface Transfer {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  receiverAccount: string
  receiverBank?: string
  initiatedAt: string
  completedAt?: string
  failureReason?: string
}

interface TransferStatusCardProps {
  transfer: Transfer
  onCancel?: (id: string) => Promise<void>
  onRetry?: (id: string) => Promise<void>
}

export default function TransferStatusCard({
  transfer,
  onCancel,
  onRetry
}: TransferStatusCardProps) {
  const statusConfig: Record<string, {
    icon: string
    label: string
    color: string
    bgColor: string
    textColor: string
  }> = {
    pending: {
      icon: '⏳',
      label: 'Pending',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    processing: {
      icon: '⚙️',
      label: 'Processing',
      color: 'blue',
      bgColor: 'bg-background',
      textColor: 'text-blue-800'
    },
    completed: {
      icon: '✓',
      label: 'Completed',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    failed: {
      icon: '✕',
      label: 'Failed',
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    }
  }

  const config = statusConfig[transfer.status]
  const timeago = formatDistanceToNow(new Date(transfer.initiatedAt), { addSuffix: true })

  return (
    <Card className={`${config.bgColor} border-${config.color}-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg">{config.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{timeago}</p>
            </div>
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded ${config.textColor}`}>
            {transfer.id.slice(0, 8)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-2xl font-bold">
            {transfer.currency} {transfer.amount.toFixed(2)}
          </span>
        </div>

        {/* Receiver */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">To</p>
          <p className="text-sm font-medium">{transfer.receiverAccount}</p>
          {transfer.receiverBank && (
            <p className="text-xs text-muted-foreground">{transfer.receiverBank}</p>
          )}
        </div>

        {/* Failure Reason */}
        {transfer.status === 'failed' && transfer.failureReason && (
          <div className="bg-red-100 border border-red-300 rounded p-2 text-xs text-red-700">
            Reason: {transfer.failureReason}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {transfer.status === 'pending' && onCancel && (
            <button
              onClick={() => onCancel(transfer.id)}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
            >
              Cancel
            </button>
          )}
          {transfer.status === 'failed' && onRetry && (
            <button
              onClick={() => onRetry(transfer.id)}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-card hover:bg-blue-200 rounded"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(transfer.id)
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-foreground bg-background hover:bg-card rounded"
          >
            Copy ID
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
