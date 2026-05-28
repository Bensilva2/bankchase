'use client'

import { useState } from 'react'
import { Shield, Smartphone, Key, LogOut, Eye, EyeOff, Loader } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { TwoFactorAuthSetup } from '@/components/two-factor-auth-setup'
import { toast } from 'sonner'

interface Session {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

function SecuritySettingsContent() {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [isSSLPinningEnabled, setIsSSLPinningEnabled] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on MacOS',
      location: 'San Francisco, CA',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: '3',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      lastActive: '3 days ago',
      current: false,
    },
  ])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleBiometric = async () => {
    setIsLoading(true)
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        toast.error('Biometric authentication is not supported on this device')
        setIsLoading(false)
        return
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        toast.error('No biometric sensor found on this device')
        setIsLoading(false)
        return
      }

      // Simulate enrollment
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsBiometricEnabled(!isBiometricEnabled)
      toast.success(
        isBiometricEnabled
          ? 'Biometric authentication disabled'
          : 'Biometric authentication enabled'
      )
    } catch (error) {
      toast.error('Failed to update biometric settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId))
    toast.success('Session revoked')
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security and privacy</p>
        </div>

        <div className="space-y-8">
          {/* Password Section */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Password</h2>
                <p className="text-sm text-muted-foreground">Change your login password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Biometric Authentication Section */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Biometric Login</h2>
                  <p className="text-sm text-muted-foreground">
                    {isBiometricEnabled
                      ? 'Biometric authentication enabled'
                      : 'Enable fingerprint or face recognition'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleBiometric}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg transition font-medium ${
                  isBiometricEnabled
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900'
                    : 'bg-primary hover:bg-primary/90 text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : isBiometricEnabled ? (
                  'Disable'
                ) : (
                  'Enable'
                )}
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Use your device&apos;s biometric features (fingerprint, face recognition) for faster and more secure login.
              This requires a compatible device with a biometric sensor.
            </p>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled
                      ? 'Two-factor authentication enabled'
                      : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              {!is2FAEnabled && !show2FASetup && (
                <button
                  onClick={() => setShow2FASetup(true)}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                >
                  Enable
                </button>
              )}
              {is2FAEnabled && (
                <button
                  onClick={() => setIs2FAEnabled(false)}
                  className="px-6 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 rounded-lg transition font-medium"
                >
                  Disable
                </button>
              )}
            </div>

            {show2FASetup && !is2FAEnabled ? (
              <div className="mt-6 pt-6 border-t border-border">
                <TwoFactorAuthSetup
                  onComplete={() => {
                    setIs2FAEnabled(true)
                    setShow2FASetup(false)
                  }}
                  onCancel={() => setShow2FASetup(false)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security by requiring a verification code in addition
                to your password.
              </p>
            )}
          </div>

          {/* SSL Pinning Section */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">SSL Certificate Pinning</h2>
                  <p className="text-sm text-muted-foreground">
                    {isSSLPinningEnabled
                      ? 'Enhanced certificate validation enabled'
                      : 'Standard certificate validation'}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                {isSSLPinningEnabled ? '✓ Enabled' : '○ Disabled'}
              </div>
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <LogOut className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Active Sessions</h2>
                <p className="text-sm text-muted-foreground">Manage devices logged into your account</p>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-background border border-border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {session.device}
                      {session.current && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.location} • Last active {session.lastActive}
                    </p>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <SecuritySettingsContent />
    </ProtectedRoute>
  )
}
