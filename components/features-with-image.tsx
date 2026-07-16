'use client'

import { Cloud, Lock, Zap } from 'lucide-react'
import Image from 'next/image'

interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    icon: <Cloud className="w-5 h-5 text-blue-400" />,
    title: 'Push to deploy',
    description: 'Instantly deploy your transactions to production with zero downtime and automatic rollback capabilities.'
  },
  {
    icon: <Lock className="w-5 h-5 text-blue-400" />,
    title: 'SSL certificates',
    description: 'Military-grade encryption with automatic certificate renewal and PCI DSS compliance built-in.'
  },
  {
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    title: 'Database backups',
    description: 'Automated daily backups with point-in-time recovery and redundancy across multiple regions.'
  }
]

export function FeaturesWithImage() {
  return (
    <div className="overflow-hidden bg-gray-900 dark:bg-gray-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pt-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-blue-400">Secure infrastructure</h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                A better workflow
              </p>
              <p className="mt-6 text-lg/8 text-gray-300">
                BankChase combines enterprise-grade security with developer-friendly APIs. Build banking applications with confidence.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-400 lg:max-w-none">
                {features.map((feature, index) => (
                  <div key={index} className="relative pl-9">
                    <dt className="inline font-semibold text-white">
                      <div className="absolute top-1 left-1">{feature.icon}</div>
                      {feature.title}.
                    </dt>
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/40">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                  </svg>
                  <p className="text-sm">Banking Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
