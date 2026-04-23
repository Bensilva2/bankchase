'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Mail, Phone, Smartphone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface TransactionAlertEvent {
  id: string
  transactionId: string
  type: 'email' | 'sms' | 'push' | 'in-app'
  status: 'pending' | 'sent' | 'failed'
  timestamp: string
  description?: string
}

interface TransactionAlertsProps {
  userId: string
  transactionId: string
  onAlertsComplete?: (alerts: TransactionAlertEvent[]) => void
}

const ALERT_TYPES = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-600' },
  sms: { icon: Phone, label: 'SMS', color: 'text-green-600' },
  push: { icon: Smartphone, label: 'Push', color: 'text-purple-600' },
  'in-app': { icon: Bell, label: 'In-App', color: 'text-orange-600' },
}

export function TransactionAlerts({
  userId,
  transactionId,
  onAlertsComplete,
}: TransactionAlertsProps) {
  const [alerts, setAlerts] = useState<TransactionAlertEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [allComplete, setAllComplete] = useState(false)

  // Listen for real-time alert updates via Server-Sent Events
  useEffect(() => {
    const connectToAlertStream = async () => {
      try {
        const eventSource = new EventSource(
          `/api/alerts/stream?userId=${userId}&transactionId=${transactionId}`
        )

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[v0] Alert update received:', data)

            setAlerts((prev) => {
              const exists = prev.some((a) => a.id === data.id)
              if (exists) {
                // Update existing alert
                return prev.map((a) => (a.id === data.id ? data : a))
              } else {
                // Add new alert
                return [...prev, data]
              }
            })

            // Check if all alerts are complete
            const allSent = [...alerts, data].every(
              (a) => a.status === 'sent' || a.status === 'failed'
            )

            if (allSent && alerts.length >= 3) {
              setAllComplete(true)
              onAlertsComplete?.([...alerts, data])
            }
          } catch (error) {
            console.error('[v0] Error parsing alert data:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('[v0] Alert stream error:', error)
          eventSource.close()
          setIsLoading(false)
        }

        // Initial load after 1 second to show loading state
        setTimeout(() => setIsLoading(false), 1000)

        return () => {
          eventSource.close()
        }
      } catch (error) {
        console.error('[v0] Failed to connect to alert stream:', error)
        setIsLoading(false)
      }
    }

    connectToAlertStream()
  }, [userId, transactionId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Transaction Alerts</h3>
        {allComplete && <Badge className="bg-green-100 text-green-800">All Sent</Badge>}
      </div>

      {isLoading && alerts.length === 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-gray-600">Sending alerts...</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const AlertIcon =
              ALERT_TYPES[alert.type as keyof typeof ALERT_TYPES]?.icon || Bell
            const alertType =
              ALERT_TYPES[alert.type as keyof typeof ALERT_TYPES]

            return (
              <Card
                key={alert.id}
                className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${alertType?.color} mt-1`}>
                      <AlertIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {alertType?.label || alert.type}
                      </p>
                      {alert.description && (
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'pending' && (
                      <>
                        <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                          Sending
                        </Badge>
                      </>
                    )}
                    {alert.status === 'sent' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          Sent
                        </Badge>
                      </>
                    )}
                    {alert.status === 'failed' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <Badge variant="outline" className="bg-red-50 text-red-800">
                          Failed
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </Card>
            )
          })}

          {!isLoading && alerts.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-gray-500">No alerts yet</p>
            </Card>
          )}
        </div>
      )}

      {allComplete && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-800">
            Transaction alerts sent successfully to all configured channels.
          </p>
        </Card>
      )}
    </div>
  )
}
