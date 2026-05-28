'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, Target, AlertCircle, Download, CalendarDays } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const spendingData = [
  { month: 'Jan', amount: 2400, budget: 3000 },
  { month: 'Feb', amount: 1398, budget: 3000 },
  { month: 'Mar', amount: 2800, budget: 3000 },
  { month: 'Apr', amount: 3908, budget: 3000 },
  { month: 'May', amount: 4800, budget: 3000 },
  { month: 'Jun', amount: 3490, budget: 3000 },
]

const categoryData = [
  { name: 'Groceries', value: 1240, percentage: 20 },
  { name: 'Dining', value: 890, percentage: 14 },
  { name: 'Transport', value: 450, percentage: 7 },
  { name: 'Entertainment', value: 620, percentage: 10 },
  { name: 'Utilities', value: 780, percentage: 12 },
  { name: 'Other', value: 1920, percentage: 37 },
]

const monthlyData = [
  { month: 'Jan', income: 5000, expenses: 2400, savings: 2600 },
  { month: 'Feb', income: 5000, expenses: 1398, savings: 3602 },
  { month: 'Mar', income: 5000, expenses: 2800, savings: 2200 },
  { month: 'Apr', income: 5000, expenses: 3908, savings: 1092 },
  { month: 'May', income: 5500, expenses: 4800, savings: 700 },
  { month: 'Jun', income: 5500, expenses: 3490, savings: 2010 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']

function AnalyticsContent() {
  const [timeRange, setTimeRange] = useState('6m')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.value, 0)
  const avgMonthlySpend = spendingData.reduce((sum, month) => sum + month.amount, 0) / spendingData.length
  const budgetRemaining = 3000 - (spendingData[spendingData.length - 1].amount || 0)
  const savingsRate = ((2010 / 5500) * 100).toFixed(1)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financial Analytics</h1>
          <p className="text-muted-foreground">Track your spending, budget, and savings trends</p>
        </div>

        {/* Time Range and Export */}
        <div className="flex gap-4 mb-8 flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            {['1m', '3m', '6m', '1y', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {range === '1m' && '1 Month'}
                {range === '3m' && '3 Months'}
                {range === '6m' && '6 Months'}
                {range === '1y' && '1 Year'}
                {range === 'all' && 'All Time'}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Spent',
              value: `$${totalSpent.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-950',
            },
            {
              label: 'Average Monthly',
              value: `$${avgMonthlySpend.toFixed(0)}`,
              icon: TrendingUp,
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-50 dark:bg-purple-950',
            },
            {
              label: 'Budget Remaining',
              value: `$${budgetRemaining.toFixed(0)}`,
              icon: Target,
              color: budgetRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
              bg: budgetRemaining < 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950',
            },
            {
              label: 'Savings Rate',
              value: `${savingsRate}%`,
              icon: TrendingUp,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-950',
            },
          ].map((metric, idx) => (
            <div key={idx} className={`${metric.bg} border border-border rounded-xl p-6`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending Trend */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Spending vs Budget
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Spent" dot={{ fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Budget" dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Spending by Category */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                      className="cursor-pointer hover:opacity-80 transition"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Income vs Expenses */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">Monthly Income vs Expenses</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="savings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">Category Breakdown</h2>
            <div className="space-y-3">
              {categoryData.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground text-sm">{category.name}</span>
                    <span className="text-sm text-muted-foreground">${category.value}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{category.percentage}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Alert */}
        {budgetRemaining < 500 && (
          <div className="p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-xl flex gap-4 mb-8">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Budget Alert</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You&apos;re close to your monthly budget limit. ${budgetRemaining.toFixed(0)} remaining.
              </p>
            </div>
          </div>
        )}

        {/* Monthly Statement */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Monthly Statements
            </h2>
          </div>
          <div className="space-y-4">
            {monthlyData.map((month, idx) => (
              <div key={idx} className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition cursor-pointer flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{month.month} 2024</p>
                  <p className="text-sm text-muted-foreground">
                    Income: ${month.income} • Expenses: ${month.expenses} • Savings: ${month.savings}
                  </p>
                </div>
                <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition font-medium text-sm">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <AnalyticsContent />
    </ProtectedRoute>
  )
}
