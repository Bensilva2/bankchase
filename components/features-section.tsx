'use client'

import { ArrowUpRight, Lock, RotateCw, Shield } from 'lucide-react'

export interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

interface FeaturesSectionProps {
  preheading?: string
  heading: string
  description?: string
  features: Feature[]
  variant?: 'dark' | 'light'
}

export function FeaturesSection({
  preheading = 'Banking made easy',
  heading = 'Everything you need',
  description,
  features,
  variant = 'dark',
}: FeaturesSectionProps) {
  const isDark = variant === 'dark'

  return (
    <div className={isDark ? 'bg-background py-24 sm:py-32' : 'bg-card py-24 sm:py-32'}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          {preheading && (
            <p className={`text-base/7 font-semibold ${isDark ? 'text-primary' : 'text-primary'}`}>
              {preheading}
            </p>
          )}
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl lg:text-balance">
            {heading}
          </h2>
          {description && (
            <p className={`mt-6 text-lg/8 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              {description}
            </p>
          )}
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature, index) => (
              <div key={index} className="relative pl-16">
                <dt className="text-base/7 font-semibold text-foreground">
                  <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                    <div className="size-6 text-primary-foreground">
                      {feature.icon}
                    </div>
                  </div>
                  {feature.title}
                </dt>
                <dd className={`mt-2 text-base/7 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

export function BankingFeatures() {
  const features: Feature[] = [
    {
      icon: <ArrowUpRight className="w-6 h-6" />,
      title: 'Instant Transfers',
      description: 'Send money to any account instantly with real-time balance updates. No delays, no hidden fees.',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Bank-Level Security',
      description: 'Military-grade encryption protects your accounts. Two-factor authentication keeps your data safe.',
    },
    {
      icon: <RotateCw className="w-6 h-6" />,
      title: 'Smart Recurring Transfers',
      description: 'Set up automatic transfers for bills and savings. Never miss a payment or savings goal again.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Fraud Protection',
      description: '24/7 monitoring detects suspicious activity. We investigate and resolve issues immediately.',
    },
  ]

  return (
    <FeaturesSection
      preheading="Better Banking"
      heading="Everything you need to manage your money"
      description="A complete banking platform built for the modern user. From instant transfers to intelligent notifications, we've got you covered."
      features={features}
    />
  )
}
