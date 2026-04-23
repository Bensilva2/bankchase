'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
}

function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const checks = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Contains number', test: /[0-9]/.test(password) },
    { label: 'Contains special character', test: /[^A-Za-z0-9]/.test(password) },
  ]

  const passedChecks = checks.filter((c) => c.test).length
  const strength =
    passedChecks === 5 ? 'Strong' : passedChecks >= 3 ? 'Fair' : 'Weak'
  const strengthColor =
    passedChecks === 5 ? 'text-green-600' : passedChecks >= 3 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password Strength:</span>
        <span className={`text-sm font-semibold ${strengthColor}`}>{strength}</span>
      </div>
      <div className="space-y-2">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {check.test ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 text-gray-300" />
            )}
            <span className={check.test ? 'text-gray-700' : 'text-gray-400'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PasswordManagementProps {
  userId: string
}

export function PasswordManagement({ userId }: PasswordManagementProps) {
  const [activeTab, setActiveTab] = useState<'change' | 'forgot'>('change')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New passwords do not match',
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
          action: 'change',
          userId,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to change password',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('[v0] Password change error:', error)
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('change')}
          className={`pb-3 font-medium text-sm transition-colors ${
            activeTab === 'change'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('forgot')}
          className={`pb-3 font-medium text-sm transition-colors ${
            activeTab === 'forgot'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          Forgot Password
        </button>
      </div>

      {activeTab === 'change' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Your Password</h3>

          <div>
            <Label htmlFor="current-pwd" className="text-sm font-medium text-gray-700">
              Current Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="current-pwd"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-pwd" className="text-sm font-medium text-gray-700">
              New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="new-pwd"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div>
            <Label htmlFor="confirm-pwd" className="text-sm font-medium text-gray-700">
              Confirm New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirm-pwd"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-600 mt-1">Passwords match</p>
            )}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      )}

      {activeTab === 'forgot' && (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Forgot Your Password?</h3>
          <p className="text-gray-600 mb-4">
            Click the button below to receive a password reset link via email
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Send Reset Link
          </Button>
        </div>
      )}
    </Card>
  )
}
