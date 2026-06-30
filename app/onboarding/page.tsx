import React from 'react'
import { OnboardingCard } from '@/components/onboarding/onboarding-card'

export const metadata = {
  title: 'AI Onboarding - BankChase',
  description: 'Complete AI onboarding experience with Resend integration',
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AI Integration Onboarding
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to get started with AI-powered email features
          </p>
        </div>

        <OnboardingCard />

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">API Key Setup</h3>
            <p className="text-sm text-muted-foreground">
              Create a Resend account and generate your API key to enable all features
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Domain Verification</h3>
            <p className="text-sm text-muted-foreground">
              Verify your domain in Resend dashboard to start sending emails
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Agent Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connect your AI agent using the MCP server for full capabilities
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
