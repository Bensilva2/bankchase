'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, Shield, Lock, Eye, AlertCircle, Smartphone, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SecurityPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { linkedDevices = [], removeDevice } = useBanking()
  const [currentTab, setCurrentTab] = useState<'password' | 'twofa' | 'privacy' | 'devices'>('password')
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState<'method' | 'verify'>('method')
  const [twoFactorMethod, setTwoFactorMethod] = useState('sms')
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    showActivity: false,
    allowMessages: true,
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert('Please fill in all fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Passwords do not match')
      return
    }
    alert('Password changed successfully')
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const mockDevices = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      type: 'Mobile',
      lastActive: '2 minutes ago',
      location: 'New York, NY',
      current: true,
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'Desktop',
      lastActive: '1 hour ago',
      location: 'New York, NY',
      current: false,
    },
    {
      id: '3',
      name: 'iPad Pro',
      type: 'Tablet',
      lastActive: '2 days ago',
      location: 'Brooklyn, NY',
      current: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security & Privacy</h1>
            <p className="text-gray-600">Manage your account security</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['password', 'twofa', 'privacy', 'devices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
                currentTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'password' && 'Password'}
              {tab === 'twofa' && '2FA'}
              {tab === 'privacy' && 'Privacy'}
              {tab === 'devices' && 'Devices'}
            </button>
          ))}
        </div>

        {/* Password Tab */}
        {currentTab === 'password' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              Change Password
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5 opacity-50" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Change Password
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Password Tips:</strong> Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.
              </p>
            </div>
          </Card>
        )}

        {/* 2FA Tab */}
        {currentTab === 'twofa' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Two-Factor Authentication
            </h2>

            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="font-semibold text-green-900">Status: Enabled</p>
                </div>
                <p className="text-green-800 text-sm">Your account is protected with SMS-based two-factor authentication.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Current 2FA Method</h3>
                <p className="text-gray-700">SMS to ••••• 9999</p>
                <button className="mt-4 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition">
                  Change Method
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Backup Codes</h3>
                <p className="text-gray-600 mb-4">
                  Save your backup codes in a secure place. You can use them to access your account if you lose access to your 2FA device.
                </p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  View Backup Codes
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Privacy Tab */}
        {currentTab === 'privacy' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Privacy Settings
            </h2>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">Profile Visibility</label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <p className="text-sm text-gray-600">Control who can see your profile information</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">Show Activity Status</label>
                  <input
                    type="checkbox"
                    checked={privacySettings.showActivity}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showActivity: e.target.checked })
                    }
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-600">Let others see when you&apos;re online</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">Allow Messages</label>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowMessages}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, allowMessages: e.target.checked })
                    }
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-600">Allow others to send you messages</p>
              </div>
            </div>

            <div className="mt-8">
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                View Privacy Policy
              </a>
            </div>
          </Card>
        )}

        {/* Devices Tab */}
        {currentTab === 'devices' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Linked Devices
            </h2>

            {mockDevices.map((device) => (
              <Card key={device.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{device.name}</h3>
                      {device.current && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{device.type}</p>
                    <p className="text-gray-600 text-sm">Last active: {device.lastActive}</p>
                    <p className="text-gray-600 text-sm">{device.location}</p>
                  </div>
                  {!device.current && (
                    <button
                      onClick={() => removeDevice?.(device.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
