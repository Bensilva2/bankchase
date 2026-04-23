import React, { useState, useCallback } from 'react'
import { useTransactionAlerts } from '@/hooks/use-transaction-alerts'
import { FlashAlert, AlertContainer } from '@/components/flash-alert'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react'

interface TransactionAlertDashboardProps {
  userId?: string
  title?: string
  showConnectionStatus?: boolean
}

export function TransactionAlertDashboard({
  userId,
  title = 'Transaction Alerts',
  showConnectionStatus = true,
}: TransactionAlertDashboardProps) {
  const { alerts, isConnected, isLoading, retry, disconnect } =
    useTransactionAlerts(userId)
  const [closedAlertIds, setClosedAlertIds] = useState<Set<string>>(new Set())
  const [displayAlerts, setDisplayAlerts] = useState<
    Array<{
      id: string
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message: string
      amount?: string
      recipient?: string
      channels?: ('email' | 'sms' | 'push')[]
    }>
  >([])

  const handleAlertClose = useCallback((id: string) => {
    setClosedAlertIds((prev) => new Set(prev).add(id))
  }, [])

  const visibleAlerts = displayAlerts.filter((a) => !closedAlertIds.has(a.id))

  return (
    <>
      <AlertContainer alerts={visibleAlerts} onAlertClose={handleAlertClose} />

      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            {showConnectionStatus && (
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnected</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Status Indicator */}
          {showConnectionStatus && (
            <div
              className={`h-1 rounded-full transition ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={retry}
              disabled={isLoading || isConnected}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect
            </Button>

            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transaction alerts yet</p>
              {isConnected && (
                <p className="text-xs mt-1">
                  Alerts will appear here in real-time
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-start gap-3">
                    {alert.status === 'sent' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : alert.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-medium text-sm text-gray-900">
                          {alert.type === 'email' ? (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email Sent
                            </span>
                          ) : alert.type === 'sms' ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              SMS Sent
                            </span>
                          ) : (
                            'Alert Sent'
                          )}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-1">
                        Status: <span className="font-medium">{alert.status}</span>
                      </p>

                      <p className="text-xs text-gray-600 mt-1">
                        Amount: <span className="font-medium">${alert.amount}</span>
                      </p>

                      {alert.recipientName && (
                        <p className="text-xs text-gray-600 mt-1">
                          To: <span className="font-medium">{alert.recipientName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics */}
          {alerts.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.length}
                </p>
                <p className="text-xs text-gray-600">Total Alerts</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter((a) => a.status === 'sent').length}
                </p>
                <p className="text-xs text-gray-600">Sent</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter((a) => a.status === 'failed').length}
                </p>
                <p className="text-xs text-gray-600">Failed</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
