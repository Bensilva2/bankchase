import React, { useEffect, useState } from 'react'
import { Bell, AlertCircle, CheckCircle, Phone, Mail, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashAlertProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  amount?: string
  recipient?: string
  channels?: ('email' | 'sms' | 'push')[]
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export function FlashAlert({
  id,
  type,
  title,
  message,
  amount,
  recipient,
  channels = [],
  onClose,
  autoClose = true,
  duration = 8000,
}: FlashAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!autoClose) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [autoClose, duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }[type]

  const borderColor = {
    success: 'border-l-4 border-l-green-500',
    error: 'border-l-4 border-l-red-500',
    warning: 'border-l-4 border-l-yellow-500',
    info: 'border-l-4 border-l-blue-500',
  }[type]

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
  }[type]

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }[type]

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Bell,
  }[type]

  return (
    <div
      className={cn(
        'fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg border animation-in fade-in slide-in-from-top-2 z-50',
        bgColor,
        borderColor
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />

        <div className="flex-1">
          <h3 className={cn('font-semibold text-sm', textColor)}>{title}</h3>
          <p className={cn('text-sm mt-1', textColor)}>{message}</p>

          {amount && recipient && (
            <div className={cn('mt-2 p-2 bg-white rounded text-xs', textColor)}>
              <p className="font-medium">
                💰 {amount} transferred to {recipient}
              </p>
            </div>
          )}

          {channels.length > 0 && (
            <div className={cn('mt-3 flex gap-2 text-xs', textColor)}>
              <span className="font-medium">Sent via:</span>
              <div className="flex gap-1">
                {channels.includes('email') && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white rounded">
                    <Mail className="w-3 h-3" />
                    Email
                  </span>
                )}
                {channels.includes('sms') && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white rounded">
                    <Phone className="w-3 h-3" />
                    SMS
                  </span>
                )}
                {channels.includes('push') && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white rounded">
                    <Send className="w-3 h-3" />
                    Push
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setIsVisible(false)
            onClose?.()
          }}
          className={cn(
            'flex-shrink-0 text-lg font-bold hover:opacity-70 transition',
            textColor
          )}
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    </div>
  )
}

interface AlertContainerProps {
  alerts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    amount?: string
    recipient?: string
    channels?: ('email' | 'sms' | 'push')[]
  }>
  onAlertClose: (id: string) => void
}

export function AlertContainer({ alerts, onAlertClose }: AlertContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <FlashAlert
            {...alert}
            onClose={() => onAlertClose(alert.id)}
            autoClose
            duration={8000}
          />
        </div>
      ))}
    </div>
  )
}
