'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check, X, AlertCircle } from 'lucide-react'

interface TwoFactorSetupProps {
  email: string
  onComplete?: (backupCodes: string[]) => void
  onCancel?: () => void
}

export function TwoFactorSetup({ email, onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'scan' | 'verify' | 'backup' | 'complete'>(
    'generate'
  )
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const { toast } = useToast()

  // Generate TOTP secret and QR code
  useEffect(() => {
    const generateSetup = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'generate' }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate TOTP setup')
        }

        setSecret(data.secret)
        setQrCode(data.qrCode)
        setBackupCodes(data.backupCodes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate setup')
        console.error('[v0] Setup generation error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    generateSetup()
  }, [email])

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode,
          secret,
          action: 'verify-setup',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      toast({
        title: 'Success',
        description: 'TOTP code verified successfully',
      })
      setStep('backup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      console.error('[v0] Verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupCodes = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          secret,
          backupCodes,
          action: 'enable',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA')
      }

      toast({
        title: 'Success',
        description: '2FA has been enabled successfully',
      })
      setStep('complete')
      onComplete?.(backupCodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable 2FA')
      console.error('[v0] Enable 2FA error:', err)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step 1: Generate & Scan */}
      {(step === 'generate' || step === 'scan') && (
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Set Up Two-Factor Authentication
              </h2>
              <p className="text-gray-600 mt-2">
                Secure your account with an authenticator app
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Step 1: Install an Authenticator App</h3>
              <p className="text-sm text-gray-600">
                Download one of these apps on your phone:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
                <li>FreeOTP</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Step 2: Scan QR Code</h3>
              {qrCode && (
                <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code for TOTP setup" className="w-64 h-64" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Step 3: Can't Scan?</h3>
              <p className="text-sm text-gray-600">Enter this code manually in your authenticator app:</p>
              <div className="p-4 bg-gray-100 rounded-lg font-mono text-center text-lg tracking-widest">
                {secret
                  .replace(/(.{4})/g, '$1 ')
                  .trim()
                  .toUpperCase()}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(secret)
                  toast({
                    title: 'Copied',
                    description: 'Secret key copied to clipboard',
                  })
                }}
                variant="outline"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Secret Key
              </Button>
            </div>

            <Button
              onClick={() => setStep('verify')}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next: Verify Code
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Verify Code */}
      {step === 'verify' && (
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Verify Your Code</h2>
              <p className="text-gray-600 mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="totp-code" className="text-base font-semibold">
                Authentication Code
              </Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setVerificationCode(value)
                  setError('')
                }}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <p className="text-sm text-gray-600">
              Your code changes every 30 seconds. Enter the current code from your authenticator app.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                onClick={() => {
                  setStep('scan')
                  setError('')
                  setVerificationCode('')
                }}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Save Backup Codes</h2>
              <p className="text-gray-600 mt-2">
                Store these codes in a safe place. Use them to access your account if you lose
                access to your authenticator app.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ Each code can only be used once. Store them securely.
              </p>
            </div>

            <div className="space-y-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <span className="font-mono text-sm text-gray-700">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code, index)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition"
                  >
                    {copiedCode === index ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                const codesText = backupCodes.join('\n')
                navigator.clipboard.writeText(codesText)
                toast({
                  title: 'Copied',
                  description: 'All backup codes copied to clipboard',
                })
              }}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Codes
            </Button>

            <div className="space-y-3">
              <Button
                onClick={handleBackupCodes}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Enabling 2FA...' : 'Complete Setup'}
              </Button>
              <Button
                onClick={() => {
                  setStep('verify')
                  setError('')
                }}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Success */}
      {step === 'complete' && (
        <Card className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">2FA Enabled</h2>
            <p className="text-gray-600 mt-2">
              Your account is now protected with two-factor authentication
            </p>
          </div>
          <Button
            onClick={() => onCancel?.()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Done
          </Button>
        </Card>
      )}
    </div>
  )
}
