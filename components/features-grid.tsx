'use client'

import { Cloud, Lock, Zap, BarChart3, Send, Shield } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <Send className="w-6 h-6" />,
    title: 'Instant Transfers',
    description: 'Send money instantly to any bank account with real-time balance updates and confirmations.'
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'SSL Certificates',
    description: 'Industry-leading encryption standards with 256-bit security for all transactions.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Smart Queues',
    description: 'Automatic transaction processing with intelligent queue management for peak performance.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Advanced Security',
    description: '24/7 fraud monitoring, biometric authentication, and two-factor verification included.'
  }
]

export function FeaturesGrid() {
  return (
    <div className="bg-gray-900 dark:bg-gray-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base/7 font-semibold text-blue-400">Deploy faster</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl lg:text-balance">
            Everything you need to deploy your app
          </p>
          <p className="mt-6 text-lg/8 text-gray-300">
            BankChase provides enterprise-grade banking infrastructure with real-time settlement, 
            advanced security features, and intelligent transaction routing.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature, index) => (
              <div key={index} className="relative pl-16">
                <dt className="text-base/7 font-semibold text-white">
                  <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-blue-500">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  {feature.title}
                </dt>
                <dd className="mt-2 text-base/7 text-gray-400">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
