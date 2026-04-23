'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Globe,
  MapPin,
  Smartphone,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react'

interface LoginRecord {
  id: string
  timestamp: string
  deviceName: string
  location: string
  ip: string
  os: string
  browser: string
  twoFactorVerified: boolean
  suspiciousFlags: string[]
  loginSuccess: boolean
}

export function LoginHistory() {
  const [history, setHistory] = useState<LoginRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'verified'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const response = await fetch('/api/security/login-history')
        if (response.ok) {
          const data = await response.json()
          setHistory(data)
        }
      } catch (error) {
        console.error('[v0] Failed to fetch login history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoginHistory()
    const interval = setInterval(fetchLoginHistory, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const filteredHistory = history.filter(record => {
    if (filter === 'suspicious') return record.suspiciousFlags.length > 0
    if (filter === 'verified') return record.twoFactorVerified
    return true
  })

  const getSuspiciousFlagLabel = (flag: string): string => {
    const labels: { [key: string]: string } = {
      'impossible_travel': 'Impossible Travel',
      'new_country': 'New Country',
      'new_city': 'New City',
      'new_device': 'New Device',
      'high_risk_ip': 'High-Risk IP',
      'known_suspicious_ip': 'Known Suspicious IP',
    }
    return labels[flag] || flag
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          <p className="mt-2 text-gray-600">Loading login history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Login History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredHistory.length} login{filteredHistory.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'suspicious', 'verified'] as const).map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Login Records */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map(record => (
            <Card
              key={record.id}
              className={`p-4 cursor-pointer transition hover:shadow-md ${
                record.suspiciousFlags.length > 0
                  ? 'border-l-4 border-l-red-500 bg-red-50'
                  : 'border-l-4 border-l-green-500 bg-green-50'
              }`}
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            >
              {/* Main Content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {record.twoFactorVerified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : record.suspiciousFlags.length > 0 ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Shield className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{record.deviceName}</h3>
                      {record.twoFactorVerified && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                          2FA Verified
                        </span>
                      )}
                      {record.suspiciousFlags.length > 0 && (
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                          Suspicious
                        </span>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{record.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span>{record.ip}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Smartphone className="w-4 h-4" />
                        <span>{record.browser}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(record.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand Indicator */}
                <div className="text-gray-400">
                  {expandedId === record.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === record.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase">OS</p>
                      <p className="text-gray-900">{record.os}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase">Status</p>
                      <p className="text-gray-900">
                        {record.loginSuccess ? '✓ Success' : '✗ Failed'}
                      </p>
                    </div>
                  </div>

                  {/* Suspicious Flags */}
                  {record.suspiciousFlags.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase mb-2">
                        Security Flags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.suspiciousFlags.map(flag => (
                          <span
                            key={flag}
                            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                          >
                            {getSuspiciousFlagLabel(flag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {record.suspiciousFlags.length > 0 && (
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white mt-3"
                      onClick={e => {
                        e.stopPropagation()
                        // Handle suspicious login action
                      }}
                    >
                      Mark as Unauthorized
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No Login Records</h3>
          <p className="text-gray-600 mt-1">No login history found for the selected filter.</p>
        </Card>
      )}
    </div>
  )
}
