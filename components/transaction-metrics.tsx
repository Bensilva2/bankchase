'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricsData {
  totalTransactions: number
  completedTransactions: number
  failedTransactions: number
  pendingTransactions: number
  successRate: number
  totalVolume: number
  averageAmount: number
  averageProcessingTime: number
}

export default function TransactionMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // This would call an actual API endpoint
        // For now, we'll show the component structure
        const response = await fetch('/api/transfers/metrics')
        if (!response.ok) throw new Error('Failed to fetch metrics')

        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('[v0] Failed to fetch metrics:', error)
        // Set mock data for demonstration
        setMetrics({
          totalTransactions: 42,
          completedTransactions: 38,
          failedTransactions: 2,
          pendingTransactions: 2,
          successRate: 95,
          totalVolume: 125400.50,
          averageAmount: 2985.73,
          averageProcessingTime: 45
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 h-24 bg-background rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-sm text-red-700">
          Failed to load transaction metrics
        </CardContent>
      </Card>
    )
  }

  const metricCards = [
    {
      title: 'Total Transfers',
      value: metrics.totalTransactions,
      subtext: `${metrics.completedTransactions} completed`,
      icon: '📤',
      color: 'blue'
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate}%`,
      subtext: `${metrics.failedTransactions} failed`,
      icon: '✓',
      color: 'green'
    },
    {
      title: 'Total Volume',
      value: `$${(metrics.totalVolume / 1000).toFixed(1)}K`,
      subtext: `Avg: $${metrics.averageAmount.toFixed(0)}`,
      icon: '💰',
      color: 'purple'
    },
    {
      title: 'Avg Processing Time',
      value: `${metrics.averageProcessingTime}s`,
      subtext: `${metrics.pendingTransactions} pending`,
      icon: '⏱️',
      color: 'orange'
    }
  ]

  const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-background', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metricCards.map((metric, idx) => {
        const style = colorStyles[metric.color]
        return (
          <Card key={idx} className={`${style.bg} border ${style.border}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className={`text-2xl font-bold ${style.text} mt-1`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{metric.subtext}</p>
                </div>
                <span className="text-2xl">{metric.icon}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
