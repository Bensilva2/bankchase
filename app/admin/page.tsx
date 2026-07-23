'use client'


import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { AlertCircle, Lock } from 'lucide-react'

function AdminDashboardContent() {
  
  const router = useRouter()

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  // For now, allow all authenticated users. Add role-based access later.
  if (!userId) {
    return null
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 pb-24 md:pb-8">
      <Navigation />
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, permissions, and system settings</p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Users Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Users</h3>
                <div className="bg-card p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">--</p>
              <p className="text-sm text-muted-foreground">Total registered users</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                View All Users →
              </Button>
            </div>
          </Card>

          {/* Permissions Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Roles</h3>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">3</p>
              <p className="text-sm text-muted-foreground">Admin, Editor, Viewer</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                Manage Roles →
              </Button>
            </div>
          </Card>

          {/* Analytics Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">--</p>
              <p className="text-sm text-muted-foreground">System activity</p>
              <Button variant="ghost" className="mt-4 text-[#0a4fa6] p-0 hover:underline">
                View Analytics →
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="border-0 shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Admin Features</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="bg-card p-2 rounded">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">User Management</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  View, manage, and delete user accounts. Assign roles and permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="bg-purple-100 p-2 rounded">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Role-Based Access Control</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Configure roles and permissions. Control what each user role can do.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="bg-yellow-100 p-2 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">System Monitoring</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Monitor system health, activities, and security logs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">System Settings</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Configure application settings, integrations, and preferences.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Admin Info */}
        <Card className="border-0 shadow-lg p-6 bg-background">
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
    </main>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
