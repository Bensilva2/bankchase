'use client'

import { CreditCard, TrendingUp, Clock, Bell } from 'lucide-react'

interface FeatureBlock {
  icon: React.ReactNode
  title: string
  description: string
  highlight: string
}

const features: FeatureBlock[] = [
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Smart Card Management',
    description: 'Issue, activate, and manage physical and virtual cards with real-time spending controls.',
    highlight: 'Cards'
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Real-Time Analytics',
    description: 'Track spending patterns, analyze transactions, and get AI-powered insights automatically.',
    highlight: 'Analytics'
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: 'Instant Settlements',
    description: 'Money transfers settle in real-time with zero delays and automatic confirmation.',
    highlight: 'Transfers'
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: 'Smart Notifications',
    description: 'Customizable alerts for transactions, low balance, large spending, and security events.',
    highlight: 'Notifications'
  }
]

export function FeaturesAlternating() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base/7 font-semibold text-blue-600 dark:text-blue-400">Everything you need</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Complete banking platform
          </p>
          <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
            From card management to real-time transfers, BankChase provides everything for modern banking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="relative">
              <div className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {feature.highlight}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-2">
                      Learn more
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
