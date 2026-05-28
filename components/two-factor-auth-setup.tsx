'use client'

import { useState } from 'react'
import { Shield, Copy, Check, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  onComplete?: () => void
  onCancel?: () => void
}

// Mock QR code generation (in real app, use a library like qrcode.react)
const generateMockSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function TwoFactorAuthSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'method' | 'setup' | 'verify'>('method')
  const [method, setMethod] = useState<'totp' | 'sms'>('totp')
  const [secret, setSecret] = useState(generateMockSecret())
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success('Secret key copied to clipboard')
  }

  const handleMethodSelect = (selectedMethod: 'totp' | 'sms') => {
    setMethod(selectedMethod)
    setSecret(generateMockSecret())
    setStep('setup')
  }

  const handleVerify = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call to verify 2FA setup
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In real app, validate the TOTP code
      if (verificationCode.length === 6) {
        toast.success('Two-factor authentication enabled successfully')
        onComplete?.()
      } else {
        toast.error('Invalid verification code format')
      }
    } catch (error) {
      toast.error('Failed to enable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'method') {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">Enable Two-Factor Authentication</h3>
          <p className="text-muted-foreground">Choose your preferred method to receive verification codes</p>
        </div>

        <div
          onClick={() => handleMethodSelect('totp')}
          className="p-6 border-2 border-border rounded-xl cursor-pointer hover:border-primary/50 transition"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-1">Authenticator App</h4>
              <p className="text-sm text-muted-foreground">
                Use apps like Google Authenticator or Authy for secure codes
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleMethodSelect('sms')}
          className="p-6 border-2 border-border rounded-xl cursor-pointer hover:border-primary/50 transition opacity-50"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-1">Text Message (SMS)</h4>
              <p className="text-sm text-muted-foreground">
                Coming soon - Receive verification codes via SMS
              </p>
            </div>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-muted-foreground hover:text-foreground transition font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Set Up Authenticator App</h3>
          <p className="text-muted-foreground">Scan this QR code with your authenticator app, or enter the key manually</p>
        </div>

        {/* Mock QR Code */}
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-border flex items-center justify-center">
            <p className="text-center text-muted-foreground text-sm">
              QR Code<br />(Scan with authenticator app)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Secret Key</label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-background border border-border rounded-lg font-mono text-sm text-foreground break-all">
              {secret}
            </div>
            <button
              onClick={handleCopySecret}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition flex items-center gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Save this key somewhere safe. You&apos;ll need it if you lose access to your device.
          </p>
        </div>

        <button
          onClick={() => setStep('verify')}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
        >
          Continue to Verification
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Verify Your Setup</h3>
        <p className="text-muted-foreground">Enter a code from your authenticator app to confirm</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-background border-2 border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setStep('setup')}
          disabled={isLoading}
          className="py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
        >
          Back
        </button>
        <button
          onClick={handleVerify}
          disabled={isLoading || verificationCode.length !== 6}
          className="py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Enable 2FA'
          )}
        </button>
      </div>
    </div>
  )
}
