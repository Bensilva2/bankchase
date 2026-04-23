'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConsentPage() {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      // Handle consent approval
      const params = new URLSearchParams(window.location.search)
      const redirectUri = params.get('redirect_uri')
      const clientId = params.get('client_id')
      
      if (redirectUri) {
        window.location.href = `${redirectUri}?approved=true&client_id=${clientId}`
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeny = async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const redirectUri = params.get('redirect_uri')
      
      if (redirectUri) {
        window.location.href = `${redirectUri}?error=access_denied`
      }
    } catch (error) {
      console.error('Error denying consent:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorization Request</CardTitle>
          <CardDescription>
            An application is requesting access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                The application is requesting permission to access your financial data and account information.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Permissions requested:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Access your account information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>View transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Manage your preferences</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={loading}
              className="flex-1"
            >
              Deny
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Approve'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can revoke this access at any time from your account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
