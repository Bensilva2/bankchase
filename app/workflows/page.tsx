import React from 'react'
import { WorkflowDashboard } from '@/components/onboarding/workflow-dashboard'

export const metadata = {
  title: 'Workflow Monitoring - BankChase',
  description: 'Monitor and track Upstash Workflow executions',
}

export default function WorkflowsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Workflow Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitor and manage Upstash Workflow executions for your onboarding system
          </p>
        </div>

        <WorkflowDashboard />

        {/* Documentation Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Quick Start
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Local dev server runs automatically with QSTASH_DEV=true</li>
              <li>✓ Trigger workflows from the onboarding page</li>
              <li>✓ Monitor execution in real-time</li>
              <li>✓ View step details and timing</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Setup Steps
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Navigate to /onboarding</li>
              <li>2. Complete all onboarding steps</li>
              <li>3. Click "Complete All & Start Workflow"</li>
              <li>4. View execution here</li>
            </ol>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              API Endpoints
            </h3>
            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <p>POST /api/onboarding/trigger - Start workflow</p>
              <p>GET /api/onboarding/status - Check status</p>
              <p>POST /api/workflow - Workflow executor</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Workflow Steps
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• validate-setup</li>
              <li>• process-api-config</li>
              <li>• verify-domain</li>
              <li>• setup-agent</li>
              <li>• send-notification</li>
            </ul>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">
            Local Development
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            The workflow system is configured to work with Upstash QStash dev server.
            For local development, ensure:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>• QSTASH_DEV=true is set in .env.local</li>
            <li>• Run `npm run dev` to start your app</li>
            <li>• Dev server starts automatically</li>
            <li>• Check console for workflow execution logs</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
