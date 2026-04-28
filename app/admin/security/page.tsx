'use client'

import { useAuth } from '@/lib/auth-context'
import { canAccessAdminDashboard } from '@/lib/rbac'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DriftDetectionDashboard } from '@/components/drift-detection-dashboard'
import { Lock, ArrowLeft, Shield, Activity, AlertTriangle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SecurityDashboard() {
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
            You don&apos;t have permission to access the security dashboard. Only administrators can view this page.
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
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0a4fa6] hover:underline mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#0a4fa6]" />
            <h1 className="text-4xl font-bold text-gray-900">Security Center</h1>
          </div>
          <p className="text-gray-600">
            Voice biometrics, behavioral drift detection, and security monitoring
          </p>
        </div>

        {/* Security Features Tabs */}
        <Tabs defaultValue="drift" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="drift" className="gap-2">
              <Activity className="w-4 h-4" />
              Drift Detection
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Security Alerts
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Shield className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drift">
            <DriftDetectionDashboard orgId="default" />
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="p-8 border-0 shadow-lg">
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Alerts</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Real-time security alerts for suspicious activities, failed authentications, 
                  and behavioral anomalies will appear here.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="p-8 border-0 shadow-lg">
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Audit Logs</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Comprehensive audit trail of all security-related events, 
                  user actions, and system changes.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-0 shadow-lg p-6 bg-blue-50 mt-8">
          <div className="flex items-start gap-4">
            <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Behavioral Biometrics</h3>
              <p className="text-blue-800 text-sm mt-1">
                This dashboard monitors voice behavioral patterns using EMA, CUSUM, and distance-based 
                drift detection algorithms. It helps identify potential fraud, coercion, or impersonation 
                by tracking deviations from established user baselines.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
