'use client'

import { useAuth } from '@/lib/auth-context'
import { canAccessAdminDashboard } from '@/lib/rbac'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Settings, BarChart3, AlertCircle, Lock, ArrowLeft, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a4fa6] to-[#003087]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // Check if user has admin access
  if (!user || !canAccessAdminDashboard(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 max-w-md border-0 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">
            You don&apos;t have permission to access the admin dashboard. Only administrators can view this page.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#0a4fa6] hover:bg-[#003087]"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0a4fa6] hover:underline mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, permissions, and system settings</p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Users Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">--</p>
              <p className="text-sm text-gray-600">Total registered users</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                View All Users →
              </Button>
            </div>
          </Card>

          {/* Permissions Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">3</p>
              <p className="text-sm text-gray-600">Admin, Editor, Viewer</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                Manage Roles →
              </Button>
            </div>
          </Card>

          {/* Analytics Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">--</p>
              <p className="text-sm text-gray-600">System activity</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                View Analytics →
              </Button>
            </div>
          </Card>
        </div>

        {/* Security Section */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Security & Biometrics</h3>
                  <p className="text-sm text-gray-600">Voice behavioral drift detection and security monitoring</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/security')}
                className="bg-[#0a4fa6] hover:bg-[#003087]"
              >
                Open Security Center
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">EMA</p>
                <p className="text-sm text-gray-600">Exponential Moving Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">CUSUM</p>
                <p className="text-sm text-gray-600">Statistical Process Control</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Distance</p>
                <p className="text-sm text-gray-600">Mahalanobis Detection</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Section */}
        <Card className="border-0 shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Features</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="bg-blue-100 p-2 rounded">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-gray-600 text-sm mt-1">
                  View, manage, and delete user accounts. Assign roles and permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="bg-purple-100 p-2 rounded">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Role-Based Access Control</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Configure roles and permissions. Control what each user role can do.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="bg-yellow-100 p-2 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Monitoring</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Monitor system health, activities, and security logs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Settings</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Configure application settings, integrations, and preferences.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Admin Info */}
        <Card className="border-0 shadow-lg p-6 bg-blue-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Administrator Access</h3>
              <p className="text-blue-800 text-sm mt-1">
                You are logged in as an administrator. With great power comes great responsibility. Handle with care.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
