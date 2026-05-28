'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const analyticsData = [
  { date: 'Mon', microdeposit: 24, identity: 18, recovery: 5 },
  { date: 'Tue', microdeposit: 32, identity: 22, recovery: 8 },
  { date: 'Wed', microdeposit: 28, identity: 19, recovery: 6 },
  { date: 'Thu', microdeposit: 35, identity: 25, recovery: 10 },
  { date: 'Fri', microdeposit: 42, identity: 28, recovery: 12 },
  { date: 'Sat', microdeposit: 18, identity: 12, recovery: 3 },
  { date: 'Sun', microdeposit: 15, identity: 10, recovery: 2 },
]

const successRateData = [
  { name: 'Successful', value: 352, color: '#10b981' },
  { name: 'Failed', value: 48, color: '#ef4444' },
  { name: 'Pending', value: 15, color: '#f59e0b' },
]

const methodComparisonData = [
  { name: 'Microdeposits', success: 94, failed: 6, pending: 3 },
  { name: 'Identity Match', success: 91, failed: 7, pending: 2 },
  { name: 'Recovery Codes', success: 97, failed: 2, pending: 1 },
]

interface AnalyticsMetric {
  label: string
  value: string | number
  change: string
  icon: React.ReactNode
  color: string
}

export default function VerificationAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')

  const metrics: AnalyticsMetric[] = [
    {
      label: 'Total Verifications',
      value: '415',
      change: '+23% this week',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Success Rate',
      value: '88.2%',
      change: '+2.1% from last week',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Avg. Time',
      value: '4m 23s',
      change: '-45s improvement',
      icon: <Clock className="w-6 h-6" />,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Failed Attempts',
      value: '48',
      change: '-12% from last week',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Verification Analytics</h1>
            <p className="text-muted-foreground">Track account verification performance and compliance</p>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                <span className={`${metric.color}`}>{metric.icon}</span>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Verification Trends */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">Verification Methods Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Legend />
                <Line type="monotone" dataKey="microdeposit" stroke="#3b82f6" strokeWidth={2} name="Microdeposits" />
                <Line type="monotone" dataKey="identity" stroke="#10b981" strokeWidth={2} name="Identity Match" />
                <Line type="monotone" dataKey="recovery" stroke="#f59e0b" strokeWidth={2} name="Recovery Codes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rate Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">Verification Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={successRateData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80}>
                  {successRateData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Method Comparison */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Method Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={methodComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
              <Legend />
              <Bar dataKey="success" stackId="a" fill="#10b981" name="Success" radius={[8, 8, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Report */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Compliance Report</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">KYC Compliance Rate</p>
                <p className="text-sm text-muted-foreground">Know Your Customer verification completion</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">98.5%</p>
                <p className="text-xs text-muted-foreground">↑ 0.8% this week</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">AML Screening Success</p>
                <p className="text-sm text-muted-foreground">Anti-Money Laundering checks passed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">99.2%</p>
                <p className="text-xs text-muted-foreground">↑ 0.3% this week</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Document Verification</p>
                <p className="text-sm text-muted-foreground">ID documents verified and validated</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">97.1%</p>
                <p className="text-xs text-muted-foreground">↑ 1.2% this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
