import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface TransactionAlert {
  id: string
  userId: string
  transactionId: string
  type: 'email' | 'sms' | 'push' | 'in-app'
  status: 'pending' | 'sent' | 'failed'
  message: string
  amount: number
  recipientName: string
  createdAt: string
}

export function useTransactionAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<TransactionAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const { toast } = useToast()

  // Connect to alert stream
  const connectToStream = useCallback(() => {
    if (!userId || eventSourceRef.current) return

    setIsLoading(true)
    try {
      const eventSource = new EventSource(`/api/alerts/stream?userId=${userId}`)

      eventSource.onopen = () => {
        console.log('[v0] Connected to alert stream')
        setIsConnected(true)
        setIsLoading(false)
      }

      eventSource.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as TransactionAlert
          console.log('[v0] Received alert:', alert)

          setAlerts((prev) => [alert, ...prev])

          // Show toast notification
          toast({
            title: 'Transaction Alert',
            description: `${alert.amount} sent to ${alert.recipientName}`,
          })
        } catch (error) {
          console.error('[v0] Error parsing alert:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[v0] Alert stream error:', error)
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          connectToStream()
        }, 3000)
      }

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('[v0] Failed to connect to alert stream:', error)
      setIsLoading(false)
    }
  }, [userId, toast])

  // Disconnect from stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  // Connect on mount
  useEffect(() => {
    if (userId) {
      connectToStream()
    }

    return () => {
      disconnect()
    }
  }, [userId, connectToStream, disconnect])

  // Retry connection
  const retry = useCallback(() => {
    disconnect()
    setTimeout(() => {
      connectToStream()
    }, 1000)
  }, [connectToStream, disconnect])

  return {
    alerts,
    isConnected,
    isLoading,
    retry,
    disconnect,
  }
}
