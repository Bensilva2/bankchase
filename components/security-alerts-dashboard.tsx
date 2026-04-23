'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Globe,
  Shield,
  Clock,
  MapPin,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

interface SecurityAlert {
  id: string
  type: 'suspicious_login' | 'new_device' | 'backup_used' | '2fa_change'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  location?: string
  ip?: string
  deviceName?: string
  timestamp: string
  status: 'active' | 'resolved' | 'ignored'
  actionRequired?: boolean
}

interface LoginSession {
  id: string
  deviceName: string
  ip: string
  location: string
  lastActive: string
  isCurrent: boolean
  twoFactorVerified: boolean
}

export function SecurityAlertsDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch security alerts and sessions
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [alertsRes, sessionsRes] = await Promise.all([
          fetch('/api/security/alerts'),
          fetch('/api/security/sessions'),
        ])

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json()
          setAlerts(alertsData)
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json()
          setSessions(sessionsData)
        }
      } catch (error) {
        console.error('[v0] Failed to fetch security data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlerts()

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Shield className="w-5 h-5 text-blue-600" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious_login':
        return <AlertTriangle className="w-5 h-5" />
      case 'new_device':
        return <Smartphone className="w-5 h-5" />
      case 'backup_used':
        return <Shield className="w-5 h-5" />
      case '2fa_change':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      })

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId))
      }
    } catch (error) {
      console.error('[v0] Failed to dismiss alert:', error)
    }
  }

  const handleLogoutDevice = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('[v0] Failed to logout device:', error)
    }
  }

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const highSeverityAlerts = activeAlerts.filter(a => a.severity === 'high')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="mt-2 text-gray-600">Loading security data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with auto-refresh toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Alerts</h2>
          <p className="text-sm text-gray-600 mt-1">
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            {highSeverityAlerts.length > 0 && (
              <span className="text-red-600 font-semibold ml-2">
                ({highSeverityAlerts.length} high priority)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
        >
          {autoRefresh ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Auto-refresh On</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 opacity-50" />
              <span>Auto-refresh Off</span>
            </>
          )}
        </button>
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          {activeAlerts.map(alert => (
            <Card
              key={alert.id}
              className={`p-4 border-l-4 cursor-pointer transition hover:shadow-md ${getSeverityColor(alert.severity)}`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>

                    {/* Alert Details */}
                    <div className="mt-3 space-y-2">
                      {alert.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.location}</span>
                        </div>
                      )}
                      {alert.ip && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>IP: {alert.ip}</span>
                        </div>
                      )}
                      {alert.deviceName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Smartphone className="w-4 h-4" />
                          <span>{alert.deviceName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {alert.actionRequired && (
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={e => {
                        e.stopPropagation()
                        // Handle action
                      }}
                    >
                      Review
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation()
                      handleDismissAlert(alert.id)
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No Active Alerts</h3>
          <p className="text-gray-600 mt-1">Your account is secure. No suspicious activity detected.</p>
        </Card>
      )}

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map(session => (
              <Card key={session.id} className="p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {session.deviceName}
                        {session.isCurrent && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Current Device
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {session.location} • {session.ip}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {session.twoFactorVerified ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>2FA Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Needs Verification</span>
                      </div>
                    )}

                    {!session.isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleLogoutDevice(session.id)}
                      >
                        Logout
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-gray-500">
            <p>No active sessions</p>
          </Card>
        )}
      </div>

      {/* Selected Alert Details Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAlert(null)}
        >
          <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getSeverityIcon(selectedAlert.severity)}
                <h3 className="text-lg font-semibold text-gray-900">{selectedAlert.title}</h3>
              </div>

              <p className="text-gray-600 mb-4">{selectedAlert.description}</p>

              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Details</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    {selectedAlert.location && <p>Location: {selectedAlert.location}</p>}
                    {selectedAlert.ip && <p>IP Address: {selectedAlert.ip}</p>}
                    {selectedAlert.deviceName && <p>Device: {selectedAlert.deviceName}</p>}
                    <p>Time: {new Date(selectedAlert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </Button>
                {selectedAlert.actionRequired && (
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Take Action
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
