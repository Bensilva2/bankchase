'use client'

import { Card } from '@/components/ui/card'
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TwoFactorStatusCardProps {
  enabled: boolean
  backupCodesAvailable: number
}

export function TwoFactorStatusCard({ enabled, backupCodesAvailable }: TwoFactorStatusCardProps) {
  return (
    <Card className={`p-4 ${enabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start gap-4">
        {enabled ? (
          <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        ) : (
          <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
        )}

        <div className="flex-1">
          <h3 className={`font-semibold ${enabled ? 'text-green-900' : 'text-yellow-900'}`}>
            {enabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled'}
          </h3>
          
          {enabled ? (
            <div className={`text-sm ${enabled ? 'text-green-700' : 'text-yellow-700'} mt-1 space-y-1`}>
              <p>✓ Your account is protected with TOTP authentication</p>
              <p>✓ You'll need your authenticator app to log in</p>
              {backupCodesAvailable > 0 && (
                <p>✓ {backupCodesAvailable} backup codes available</p>
              )}
              {backupCodesAvailable === 0 && (
                <p className="text-yellow-600 font-medium">
                  ⚠ No backup codes left. Generate new ones if possible.
                </p>
              )}
            </div>
          ) : (
            <div className={`text-sm ${enabled ? 'text-green-700' : 'text-yellow-700'} mt-1 space-y-1`}>
              <p>Your account is relying on password-based authentication only</p>
              <p>Consider enabling 2FA for enhanced security</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
