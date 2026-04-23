'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface SecureLoginProps {
  onLogin: (userId: string) => void
}

export function SecureLogin({ onLogin }: SecureLoginProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { toast } = useToast()
  
  // Track abort controllers for each request
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email and password',
        variant: 'destructive',
      })
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials',
          variant: 'destructive',
        })
        return
      }

      if (data.requiresOTP) {
        setUserId(data.userId)
        setStep('otp')
        toast({
          title: 'OTP Sent',
          description: 'Check your email/SMS for the verification code',
        })
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[v0] Login request was cancelled')
        return
      }
      
      if (!isMountedRef.current) return
      
      console.error('[v0] Login error:', error)
      toast({
        title: 'Error',
        description: 'Authentication failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [email, password, toast])

  const handleOTPVerify = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      })
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          userId,
          otp,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'OTP Verification Failed',
          description: data.error || 'Invalid code',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'You are now logged in securely',
      })

      onLogin(userId)
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[v0] OTP verification request was cancelled')
        return
      }

      if (!isMountedRef.current) return
      
      console.error('[v0] OTP verification error:', error)
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [otp, userId, onLogin, toast])

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Image 
              src="/images/chase-logo.png" 
              alt="Chase" 
              width={64} 
              height={64} 
              className="mx-auto mb-4 rounded-lg"
            />
            <h1 className="text-2xl font-bold text-gray-900">Verify Your Identity</h1>
            <p className="text-sm text-gray-600 mt-2">
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="mt-1 text-center tracking-widest font-mono text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Code expires in 5 minutes
              </p>
            </div>

            <Button
              onClick={handleOTPVerify}
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </Button>

            <button
              onClick={() => setStep('credentials')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Image 
            src="/images/chase-logo.png" 
            alt="Chase" 
            width={64} 
            height={64} 
            className="mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-gray-900">Secure Login</h1>
          <p className="text-sm text-gray-600 mt-1">
            Personal Finance Dashboard
          </p>
        </div>

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

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <ul className="text-xs text-red-600 mt-2 list-disc list-inside space-y-1">
                {passwordErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700">
              <strong>Demo Credentials:</strong>
              <br />
              Email: demo@example.com
              <br />
              Password: SecurePass123!
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10"
          >
            {isLoading ? 'Authenticating...' : 'Sign In Securely'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </button>
            </p>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p>Your connection is encrypted and secure</p>
            <p className="flex items-center justify-center gap-1 mt-1">
              🔒 Bank-level security
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
