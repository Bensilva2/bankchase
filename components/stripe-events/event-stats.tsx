'use client'

import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'

interface EventStatsProps {
  stats?: {
    total: number
    received: number
    processing: number
    completed: number
    failed: number
    byType: Record<string, number>
  }
  loading?: boolean
}

export function EventStats({ stats, loading }: EventStatsProps) {
  const statCards = [
    {
      label: 'Total Events',
      value: stats?.total || 0,
      icon: Zap,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      label: 'Processing',
      value: stats?.processing || 0,
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Failed',
      value: stats?.failed || 0,
      icon: AlertCircle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {loading ? '--' : card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
