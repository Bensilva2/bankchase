'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Shield } from 'lucide-react'

interface Login2FAVerifyProps {
  email: string
  sessionToken: string
  onSuccess: () => void
  onBackup?: () => void
}

export function Login2FAVerify({
  email,
  sessionToken,
  onSuccess,
  onBackup,
}: Login2FAVerifyProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [usingBackupCode, setUsingBackupCode] = useState(false)
  const { toast } = useToast()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a code',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.replace(/\s/g, ''),
          sessionToken,
          isBackupCode: usingBackupCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= 3) {
          toast({
            title: 'Error',
            description: 'Too many failed attempts. Please try again later.',
            variant: 'destructive',
          })
          setCode('')
          setAttempts(0)
        } else {
          toast({
            title: 'Invalid Code',
            description: `${data.error || 'Please check and try again'} (${3 - newAttempts} attempts remaining)`,
            variant: 'destructive',
          })
          setCode('')
        }
        return
      }

      toast({
        title: 'Success',
        description: '2FA verification successful',
      })

      setCode('')
      setAttempts(0)
      onSuccess()
    } catch (error) {
      console.error('[v0] 2FA verification error:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify code',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-8 w-full max-w-md">
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-600 mt-1">
            {usingBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="code" className="text-sm font-medium text-gray-700">
              {usingBackupCode ? 'Backup Code' : 'Authenticator Code'}
            </Label>
            <Input
              id="code"
              type="text"
              placeholder={usingBackupCode ? 'xxxx-xxxx-xxxx' : '000000'}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9\-\s]/g, '')
                setCode(val.toUpperCase())
              }}
              disabled={isLoading}
              maxLength={usingBackupCode ? 15 : 6}
              autoFocus
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {attempts > 0 && `${3 - attempts} attempts remaining`}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        {onBackup && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setUsingBackupCode(!usingBackupCode)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {usingBackupCode ? 'Use authenticator app instead' : "Don't have your phone? Use backup code"}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          We won't share this code with anyone
        </p>
      </div>
    </Card>
  )
}
