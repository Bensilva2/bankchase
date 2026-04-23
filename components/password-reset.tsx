'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

interface PasswordResetProps {
  onBack?: () => void
}

export function PasswordReset({ onBack }: PasswordResetProps) {
  const [step, setStep] = useState<'email' | 'verification' | 'reset' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { toast } = useToast()

  const validatePasswordStrength = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character')
    return errors
  }

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-reset-code',
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send reset code',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Verification code sent to your email',
      })
      setStep('verification')
    } catch (error) {
      console.error('[v0] Password reset email error:', error)
      toast({
        title: 'Error',
        description: 'Failed to send reset code. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-reset-code',
          email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Invalid Code',
          description: data.error || 'The code you entered is invalid or expired',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Code Verified',
        description: 'You can now set a new password',
      })
      setStep('reset')
    } catch (error) {
      console.error('[v0] Verification error:', error)
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    const errors = validatePasswordStrength(newPassword)
    if (errors.length > 0) {
      setPasswordErrors(errors)
      toast({
        title: 'Weak Password',
        description: 'Password does not meet security requirements',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are identical',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email,
          code: verificationCode,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reset password',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Your password has been reset successfully',
      })
      setStep('success')
    } catch (error) {
      console.error('[v0] Password reset error:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">Your password has been updated securely. You can now log in with your new password.</p>
          <Button
            onClick={onBack || (() => window.location.reload())}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Login
          </Button>
        </Card>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <button
            onClick={() => setStep('verification')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Set New Password</h1>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordErrors(validatePasswordStrength(e.target.value))
                }}
                className="mt-1"
              />
              {passwordErrors.length > 0 && (
                <ul className="text-xs text-red-600 mt-2 list-disc list-inside space-y-1">
                  {passwordErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <strong>Password Requirements:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            <Button
              onClick={handlePasswordReset}
              disabled={isLoading || !newPassword || !confirmPassword || passwordErrors.length > 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <button
            onClick={() => setStep('email')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-sm text-gray-600 mb-6">Enter the 6-digit code we sent to {email}</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="mt-1 text-center tracking-widest font-mono text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Code expires in 15 minutes</p>
            </div>

            <Button
              onClick={handleVerificationSubmit}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <button
          onClick={onBack || (() => window.history.back())}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter your email address and we'll send you a code to reset your password.</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            onClick={handleEmailSubmit}
            disabled={isLoading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              Remember your password?{' '}
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
