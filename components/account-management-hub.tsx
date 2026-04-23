'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Shield,
  Bell,
  Eye,
  CreditCard,
  Database,
  Smartphone,
  Clock,
  Activity,
  User,
  Globe,
  FileText,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface AccountManagementOption {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  category: 'quick' | 'profile' | 'security' | 'devices' | 'activity' | 'advanced'
  status?: 'active' | 'inactive' | 'alert' | 'pending'
  onClick: () => void
}

interface AccountManagementHubProps {
  onSelectOption: (optionId: string) => void
  onLogout?: () => void
  userName?: string
  lastSync?: Date
}

export function AccountManagementHub({
  onSelectOption,
  onLogout,
  userName = 'User',
  lastSync,
}: AccountManagementHubProps) {
  const [activeCategory, setActiveCategory] = useState<
    'quick' | 'profile' | 'security' | 'devices' | 'activity' | 'advanced'
  >('quick')
  const [expandedSection, setExpandedSection] = useState<string | null>('quick')

  const options: AccountManagementOption[] = [
    // Quick Actions
    {
      id: 'settings',
      icon: <Zap className="h-5 w-5" />,
      label: 'Quick Settings',
      description: 'Access your most important settings',
      category: 'quick',
      status: 'active',
      onClick: () => onSelectOption('settings'),
    },
    {
      id: 'notifications',
      icon: <Bell className="h-5 w-5" />,
      label: 'Notifications',
      description: 'Manage notification preferences',
      category: 'quick',
      status: 'active',
      onClick: () => onSelectOption('notifications'),
    },

    // Profile Management
    {
      id: 'profile',
      icon: <User className="h-5 w-5" />,
      label: 'My Profile',
      description: 'View and edit personal information',
      category: 'profile',
      status: 'active',
      onClick: () => onSelectOption('profile'),
    },
    {
      id: 'editProfile',
      icon: <User className="h-5 w-5" />,
      label: 'Edit Profile',
      description: 'Update your account information',
      category: 'profile',
      onClick: () => onSelectOption('editProfile'),
    },
    {
      id: 'accountManagement',
      icon: <Settings className="h-5 w-5" />,
      label: 'Account Management',
      description: 'Manage linked accounts and settings',
      category: 'profile',
      onClick: () => onSelectOption('accountManagement'),
    },

    // Security
    {
      id: 'security',
      icon: <Shield className="h-5 w-5" />,
      label: 'Security & Privacy',
      description: 'Manage your security settings',
      category: 'security',
      status: 'active',
      onClick: () => onSelectOption('security'),
    },
    {
      id: 'security-password',
      icon: <Shield className="h-5 w-5" />,
      label: 'Change Password',
      description: 'Update your account password',
      category: 'security',
      onClick: () => onSelectOption('security-password'),
    },
    {
      id: 'security-2fa',
      icon: <Shield className="h-5 w-5" />,
      label: 'Two-Factor Auth',
      description: 'Enable additional security layer',
      category: 'security',
      status: 'active',
      onClick: () => onSelectOption('security-2fa'),
    },

    // Devices & Activity
    {
      id: 'devices',
      icon: <Smartphone className="h-5 w-5" />,
      label: 'Linked Devices',
      description: 'Manage your connected devices',
      category: 'devices',
      onClick: () => onSelectOption('devices'),
    },
    {
      id: 'loginHistory',
      icon: <Clock className="h-5 w-5" />,
      label: 'Login History',
      description: 'View your recent sign-in activity',
      category: 'devices',
      onClick: () => onSelectOption('loginHistory'),
    },
    {
      id: 'activity',
      icon: <Activity className="h-5 w-5" />,
      label: 'Recent Activity',
      description: 'See your account activity log',
      category: 'activity',
      onClick: () => onSelectOption('activity'),
    },

    // Advanced Options
    {
      id: 'cards',
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Card Management',
      description: 'Manage your credit and debit cards',
      category: 'advanced',
      onClick: () => onSelectOption('cards'),
    },
    {
      id: 'privacy',
      icon: <Eye className="h-5 w-5" />,
      label: 'Privacy Controls',
      description: 'Manage your privacy preferences',
      category: 'advanced',
      onClick: () => onSelectOption('privacy'),
    },
    {
      id: 'data',
      icon: <Database className="h-5 w-5" />,
      label: 'Data Management',
      description: 'Download or delete your data',
      category: 'advanced',
      onClick: () => onSelectOption('data'),
    },
    {
      id: 'statements',
      icon: <FileText className="h-5 w-5" />,
      label: 'Account Statements',
      description: 'Access your account statements',
      category: 'advanced',
      onClick: () => onSelectOption('viewStatements'),
    },
  ]

  const categories = [
    { id: 'quick', label: 'Quick Access', color: 'bg-blue-50' },
    { id: 'profile', label: 'Profile', color: 'bg-purple-50' },
    { id: 'security', label: 'Security', color: 'bg-red-50' },
    { id: 'devices', label: 'Devices', color: 'bg-indigo-50' },
    { id: 'activity', label: 'Activity', color: 'bg-green-50' },
    { id: 'advanced', label: 'Advanced', color: 'bg-orange-50' },
  ]

  const categoryOptions = options.filter((opt) => opt.category === activeCategory)
  const activeCardColor = categories.find((c) => c.id === activeCategory)?.color || 'bg-gray-50'

  const getStatusIcon = (status?: string) => {
    if (!status) return null
    if (status === 'active')
      return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === 'alert')
      return <AlertCircle className="h-4 w-4 text-red-600" />
    if (status === 'pending')
      return <Clock className="h-4 w-4 text-amber-600" />
    return null
  }

  return (
    <div className="pb-24 space-y-4 px-4">
      {/* Header with Sync Status */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold mb-2">Account Management</h2>
        <p className="text-sm text-gray-600">
          {lastSync
            ? `Last synced: ${lastSync.toLocaleTimeString()}`
            : 'All settings are synced in real-time'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id as any)
              setExpandedSection(category.id)
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all snap-start ${
              activeCategory === category.id
                ? 'bg-[#0a4fa6] text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className={`rounded-xl p-4 ${activeCardColor} transition-colors`}>
        <div className="space-y-2">
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.onClick}
              className="w-full text-left p-3 rounded-lg hover:bg-white/70 transition-colors active:bg-white/50"
            >
              <div className="flex items-start gap-3">
                <div className="text-[#0a4fa6] mt-0.5">{option.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {option.label}
                    </p>
                    {getStatusIcon(option.status)}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {option.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <Card className="p-4 bg-gradient-to-r from-[#0a4fa6]/10 to-blue-100/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#0a4fa6]">6</p>
            <p className="text-xs text-gray-600 mt-1">Active Devices</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0a4fa6]">3</p>
            <p className="text-xs text-gray-600 mt-1">Linked Accounts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0a4fa6]">100%</p>
            <p className="text-xs text-gray-600 mt-1">Secure</p>
          </div>
        </div>
      </Card>

      {/* Sign Out Button */}
      {onLogout && (
        <Button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 pb-8">
        <p>Real-time account synchronization enabled</p>
        <p className="mt-1">Your account is protected with 256-bit encryption</p>
      </div>
    </div>
  )
}
