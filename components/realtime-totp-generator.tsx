'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateTOTPCode } from '@/lib/auth/totp-service'

interface RealtimeTOTPGeneratorProps {
  secret: string | null
  deviceName?: string
  onCodeGenerated?: (code: string) => void
  className?: string
}

export function RealtimeTOTPGenerator({
  secret,
  deviceName = 'Authenticator App',
  onCodeGenerated,
  className = '',
}: RealtimeTOTPGeneratorProps) {
  const [currentCode, setCurrentCode] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  const { toast } = useToast()

  // Generate TOTP code based on current time
  const generateNewCode = useCallback(() => {
    if (!secret) {
      setCurrentCode('000000')
      return
    }

    try {
      const code = generateTOTPCode(secret)
      setCurrentCode(code)
      onCodeGenerated?.(code)
    } catch (error) {
      console.error('[v0] Error generating TOTP code:', error)
      setCurrentCode('000000')
    }
  }, [secret, onCodeGenerated])

  // Update time remaining and generate new code when necessary
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const timeInCurrentWindow = (now % 30000) / 1000
      const remaining = Math.ceil(30 - timeInCurrentWindow)

      setTimeRemaining(remaining)

      // Generate new code at the start of each 30-second window
      if (remaining === 30) {
        generateNewCode()
      }
    }

    // Initial generation
    generateNewCode()
    updateTimer()

    // Update timer every 100ms for smooth display
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [secret, generateNewCode])

  const handleCopyCode = async () => {
    if (!currentCode || currentCode === '000000') {
      toast({
        title: 'Error',
        description: 'No valid code to copy',
        variant: 'destructive',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(currentCode)
      setCopiedAt(Date.now())
      toast({
        title: 'Copied',
        description: 'TOTP code copied to clipboard',
        duration: 2000,
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedAt(null), 2000)
    } catch (error) {
      console.error('[v0] Failed to copy code:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      })
    }
  }

  // Calculate progress percentage
  const progressPercentage = ((30 - timeRemaining) / 30) * 100

  if (!secret) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">No authenticator configured</p>
          <p className="text-xs text-gray-500">Set up two-factor authentication to see codes here</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Device Name */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{deviceName}</p>
            <p className="text-xs text-gray-500">Time-based code</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              timeRemaining > 10
                ? 'bg-green-100 text-green-700'
                : timeRemaining > 5
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {timeRemaining}s
            </span>
          </div>
        </div>

        {/* TOTP Code Display */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
            <div className="flex-1">
              {isVisible ? (
                <div className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
                  {currentCode.slice(0, 3)} {currentCode.slice(3)}
                </div>
              ) : (
                <div className="text-4xl font-mono font-bold text-gray-400 tracking-widest">
                  ••• •••
                </div>
              )}
            </div>

            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-2 text-gray-500 hover:text-gray-700 transition"
              title={isVisible ? 'Hide code' : 'Show code'}
            >
              {isVisible ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all ease-linear"
              style={{
                width: `${progressPercentage}%`,
                transitionDuration: '100ms',
              }}
            />
          </div>

          {/* Copy Button */}
          <Button
            onClick={handleCopyCode}
            disabled={currentCode === '000000'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copiedAt ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            This code changes every 30 seconds. Each code can only be used once.
          </p>
        </div>
      </div>
    </Card>
  )
}
