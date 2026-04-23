'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  Clock,
  AlertCircle,
  Send,
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface WireTransferStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  timestamp?: string
  error?: string
}

interface WireTransferDashboardProps {
  transferId: string
  amount: number
  recipientName: string
  recipientBank: string
  steps: WireTransferStep[]
  progress: number
  currentStatus: string
  isProcessing?: boolean
  onCancel?: () => void
  onRetry?: () => void
}

export function WireTransferDashboard({
  transferId,
  amount,
  recipientName,
  recipientBank,
  steps,
  progress,
  currentStatus,
  isProcessing = false,
  onCancel,
  onRetry,
}: WireTransferDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Simulate real-time refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }, [])

  // Auto-refresh every 5 seconds when processing
  useEffect(() => {
    if (!isProcessing) return
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [isProcessing])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'active':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      default:
        return 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepIcon = (stepId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      form: <FileText className="h-4 w-4" />,
      review: <FileText className="h-4 w-4" />,
      otp: <Shield className="h-4 w-4" />,
      cot: <Lock className="h-4 w-4" />,
      tax: <FileText className="h-4 w-4" />,
      processing: <Send className="h-4 w-4" />,
    }
    return iconMap[stepId] || <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-[#0a4fa6] via-[#0a4fa6] to-[#083d80] text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Wire Transfer</h2>
            <p className="text-blue-100 text-sm flex items-center gap-2">
              ID: <span className="font-mono">{transferId}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${
                isProcessing 
                  ? 'bg-amber-100 text-amber-900' 
                  : progress === 100
                    ? 'bg-green-100 text-green-900'
                    : 'bg-blue-100 text-blue-900'
              }`}
            >
              {isProcessing ? 'Processing' : progress === 100 ? 'Completed' : 'In Progress'}
            </Badge>
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-400">
          <div>
            <p className="text-blue-100 text-sm mb-1 font-medium">Amount</p>
            <p className="text-2xl font-bold">${amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1 font-medium">To</p>
            <p className="text-lg font-semibold truncate">{recipientName}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1 font-medium">Bank</p>
            <p className="text-lg font-semibold truncate">{recipientBank}</p>
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <Card className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-950/50 dark:to-slate-900 border-l-4 border-[#0a4fa6]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-base text-[#0a4fa6]">Overall Progress</h3>
            <p className="text-xs text-muted-foreground mt-1">{currentStatus}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#0a4fa6]">{Math.round(progress)}%</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="transition"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-3 rounded-full" />
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </Card>

      {/* Steps Timeline */}
      <Card className="p-6 border-l-4 border-[#0a4fa6]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-[#0a4fa6]">Verification Steps</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0a4fa6] font-semibold">
            {steps.filter(s => s.status === 'completed').length} of {steps.length} complete
          </span>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center pt-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all shadow-md ${
                    step.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step.status === 'active'
                        ? 'bg-[#0a4fa6] text-white animate-pulse'
                        : step.status === 'failed'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {getStatusIcon(step.status)}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-10 mt-2 transition-all ${
                      step.status === 'completed' ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2 text-foreground">
                    {getStepIcon(step.id)}
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xs text-muted-foreground font-medium">{step.timestamp}</span>
                  )}
                </div>
                {step.error && (
                  <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">{step.error}</p>
                  </div>
                )}
                {step.status === 'active' && (
                  <p className="text-xs text-[#0a4fa6] font-medium mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Waiting for verification...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      {(isProcessing || steps.some((s) => s.status === 'failed')) && (
        <Card className="p-4 flex gap-3 border-l-4 border-[#0a4fa6] bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 transition hover:border-red-300 hover:text-red-600"
            >
              Cancel Transfer
            </Button>
          )}
          {onRetry && steps.some((s) => s.status === 'failed') && (
            <Button
              onClick={onRetry}
              className="flex-1 bg-[#0a4fa6] hover:bg-[#083d80] text-white font-semibold transition"
            >
              Retry Verification
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
