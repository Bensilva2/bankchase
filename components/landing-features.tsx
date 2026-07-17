'use client'

import { Zap, TrendingUp, Users, Gauge, Bell, Eye } from 'lucide-react'

export function LandingFeatures() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Real-time transfers and instant balance updates. Experience banking without delays.',
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Track spending patterns and get AI-powered insights to improve your financial health.',
    },
    {
      icon: Users,
      title: 'Easy Sharing',
      description: 'Invite family and friends. Manage joint accounts with complete transparency.',
    },
    {
      icon: Gauge,
      title: 'Full Control',
      description: 'Granular spending controls, card freezing, and spending limits on demand.',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Customizable alerts for transactions, low balance, and security events.',
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'Your data is yours. End-to-end encryption on all sensitive information.',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Features designed for you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need for modern banking, all in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative p-6 rounded-xl border border-border hover:border-primary/50 bg-background hover:bg-card transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
