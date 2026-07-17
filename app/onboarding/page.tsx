import React from 'react'
import { OnboardingCard } from '@/components/onboarding/onboarding-card'
import { CheckCircle2, Zap, Shield } from 'lucide-react'
import { OnboardingViewTracker } from '@/components/onboarding/onboarding-view-tracker'

export const metadata = {
  title: 'Get Started - BankChase AI Suite',
  description: 'Set up your AI-powered banking platform in minutes',
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <OnboardingViewTracker />
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Get Your AI Suite Running
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Complete the setup process below to unlock AI-powered features for your banking platform. Each step takes just a few minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-5 h-5 text-accent" />
                <span>Lightning fast setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-5 h-5 text-accent" />
                <span>Enterprise secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Production ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Card Section */}
      <div className="container mx-auto px-4 py-16">
        <OnboardingCard />
      </div>

      {/* Feature Highlights */}
      <div className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 flex items-center justify-center">
                <Zap className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                Fast Deployment
              </h3>
              <p className="text-muted-foreground">
                Get your AI suite live in minutes with our automated setup workflow and pre-configured integrations.
              </p>
            </div>

            <div className="group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                Enterprise Security
              </h3>
              <p className="text-muted-foreground">
                Bank-grade security with encryption, compliance, and audit trails built in from day one.
              </p>
            </div>

            <div className="group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                Full Support
              </h3>
              <p className="text-muted-foreground">
                Expert guidance, documentation, and 24/7 support to help you succeed every step of the way.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
