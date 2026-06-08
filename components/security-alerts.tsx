'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, MapPin, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SecurityAlert {
  id: string
  type: 'suspicious' | 'new-device' | 'unusual-activity' | 'password-change'
  title: string
  description: string
  timestamp: string
  location: string
  device: string
  status: 'pending' | 'resolved'
  severity: 'high' | 'medium' | 'low'
}

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'new-device',
    title: 'New Device Login',
    description: 'Your account was accessed from a new device',
    timestamp: '2 hours ago',
    location: 'New York, NY',
    device: 'iPhone 14 Pro',
    status: 'pending',
    severity: 'medium',
  },
  {
    id: '2',
    type: 'unusual-activity',
    title: 'Unusual Account Activity',
    description: 'Multiple failed login attempts detected',
    timestamp: '1 day ago',
    location: 'Unknown',
    device: 'Multiple',
    status: 'resolved',
    severity: 'high',
  },
  {
    id: '3',
    type: 'password-change',
    title: 'Password Changed',
    description: 'Your password was successfully changed',
    timestamp: '5 days ago',
    location: 'San Francisco, CA',
    device: 'MacBook Pro',
    status: 'resolved',
    severity: 'low',
  },
]

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'suspicious':
      return <AlertCircle className="w-5 h-5 text-red-600" />
    case 'new-device':
      return <Smartphone className="w-5 h-5 text-yellow-600" />
    case 'unusual-activity':
      return <AlertCircle className="w-5 h-5 text-orange-600" />
    case 'password-change':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    default:
      return <AlertCircle className="w-5 h-5" />
  }
}

export function SecurityAlerts() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Security Alerts</h2>
        <Button variant="outline" className="text-sm">
          Clear All
        </Button>
      </div>

      {mockAlerts.length === 0 ? (
        <Card className="bg-white shadow-lg border-0 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Security Alerts</h3>
          <p className="text-gray-600 mt-2">Your account appears to be secure. No suspicious activity detected.</p>
        </Card>
      ) : (
        mockAlerts.map((alert) => (
          <Card key={alert.id} className="bg-white shadow-lg border-0 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(alert.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{alert.description}</p>
                  </div>
                  <Badge className={`ml-4 flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {alert.timestamp}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {alert.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    {alert.device}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Badge className={alert.status === 'resolved' ? 'bg-green-100 text-green-800 border-0' : 'bg-yellow-100 text-yellow-800 border-0'}>
                    {alert.status === 'resolved' ? 'Resolved' : 'Pending Review'}
                  </Badge>
                  {alert.status === 'pending' && (
                    <>
                      <Button variant="ghost" className="text-sm h-8">
                        Confirm Secure
                      </Button>
                      <Button variant="ghost" className="text-sm h-8 text-red-600">
                        Report Suspicious
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
