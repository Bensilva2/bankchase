'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  DollarSign,
  Building2,
  ArrowRight,
  Calendar,
  Lock,
} from 'lucide-react'
import { wireOptionsService } from '@/lib/wire-options-service'

interface WireTransfer {
  id: string
  optionId: string
  amount: number
  fee: number
  fromBank: string
  toBank: string
  recipientName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  estimatedDelivery: Date
  lastUpdate: Date
}

interface WireTransferTrackerProps {
  wireTransfer: WireTransfer
  showRealTimeUpdates?: boolean
}

export function WireTransferTracker({
  wireTransfer,
  showRealTimeUpdates = true,
}: WireTransferTrackerProps) {
  const [status, setStatus] = useState(wireTransfer.status)
  const [progressPercent, setProgressPercent] = useState(
    status === 'completed' ? 100 : status === 'processing' ? 50 : 0
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [isLive, setIsLive] = useState(true)

  const option = wireOptionsService.getOption(wireTransfer.optionId)
  const totalCost = wireTransfer.amount + wireTransfer.fee

  // Simulate real-time status updates
  useEffect(() => {
    if (!showRealTimeUpdates || !isLive) return

    const intervals: NodeJS.Timeout[] = []

    // Update progress
    if (status === 'pending' || status === 'processing') {
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          if (status === 'completed') return 100
          if (prev >= 95) {
            setStatus('completed')
            setProgressPercent(100)
            return 100
          }
          return prev + Math.random() * 10
        })
      }, 2000)
      intervals.push(progressInterval)
    }

    // Update status messages
    const messages = {
      pending: [
        'Initializing transfer...',
        'Verifying account details...',
        'Checking funds availability...',
      ],
      processing: [
        'Processing through Federal Reserve system...',
        'Routing to recipient bank...',
        'Finalizing transfer details...',
        'Sending wire instruction...',
      ],
      completed: ['Transfer completed successfully!', 'Funds delivered to recipient bank.'],
    }

    let messageIndex = 0
    const messageInterval = setInterval(() => {
      const currentMessages = messages[status]
      setStatusMessage(currentMessages[messageIndex % currentMessages.length])
      messageIndex++
    }, 3000)
    intervals.push(messageInterval)

    return () => intervals.forEach(clearInterval)
  }, [status, showRealTimeUpdates, isLive])

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="w-6 h-6 text-amber-600" />
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'pending':
        return 'bg-amber-50 border-amber-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'completed':
        return 'outline'
      case 'processing':
        return 'secondary'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const timeElapsed = Math.floor(
    (new Date().getTime() - wireTransfer.createdAt.getTime()) / 1000
  )
  const timeRemaining = Math.floor(
    (wireTransfer.estimatedDelivery.getTime() - new Date().getTime()) / 1000
  )

  const formatTime = (seconds: number) => {
    if (seconds < 0) return 'Completed'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-4">
      <Card className={`p-6 border-2 transition-all ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Wire Transfer
                {wireTransfer.id && ` #${wireTransfer.id.slice(-6).toUpperCase()}`}
              </h3>
              <p className="text-sm text-gray-600">{option?.name || 'Standard Transfer'}</p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant()} className="capitalize">
            {status}
          </Badge>
        </div>

        {/* Amount Display */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
          <div>
            <div className="text-sm text-gray-600 mb-1">Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              ${wireTransfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Fee</div>
            <div className="text-lg font-semibold text-gray-700">
              ${wireTransfer.fee.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-lg font-semibold text-gray-900">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Transfer Path */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase mb-1">From</div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <div className="font-semibold text-gray-900">{wireTransfer.fromBank}</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase mb-1">To</div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <div className="font-semibold text-gray-900">{wireTransfer.toBank}</div>
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-6 pb-6 border-b">
          <div className="text-xs text-gray-500 uppercase mb-2">Recipient</div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-600" />
            <div className="font-semibold text-gray-900">{wireTransfer.recipientName}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-gray-900">Transfer Progress</div>
            <div className="text-sm text-gray-600">{Math.round(progressPercent)}%</div>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-white/50 rounded-lg border">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              {statusMessage}
            </p>
          </div>
        )}

        {/* Timeline Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Created</div>
            <div className="font-semibold text-gray-900">
              {wireTransfer.createdAt.toLocaleTimeString()} {wireTransfer.createdAt.toLocaleDateString()}
            </div>
            <div className="text-gray-600 mt-1">
              {formatTime(timeElapsed)} ago
            </div>
          </div>
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Est. Delivery</div>
            <div className="font-semibold text-gray-900">
              {wireTransfer.estimatedDelivery.toLocaleDateString()}
            </div>
            <div className={timeRemaining > 0 ? 'text-gray-600' : 'text-green-600 font-semibold'}>
              {timeRemaining > 0 ? `in ${formatTime(timeRemaining)}` : 'Delivered'}
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        {showRealTimeUpdates && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="text-xs text-gray-600">Live Status Updates</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-semibold">{isLive ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-2">Transfer Details</p>
          <ul className="space-y-1 text-xs">
            <li>
              <strong>Option ID:</strong> {wireTransfer.optionId}
            </li>
            <li>
              <strong>Processing Time:</strong> {option?.processingTime || 'N/A'}
            </li>
            <li>
              <strong>Last Updated:</strong> {wireTransfer.lastUpdate.toLocaleTimeString()}
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
