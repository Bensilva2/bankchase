'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SpendingData {
  category: string
  amount: number
  percentage: number
}

interface MonthlyTrend {
  month: string
  spending: number
  income: number
}

interface AnalyticsDashboardProps {
  userId?: string
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingData[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [totalSpending, setTotalSpending] = useState(0)
  const [averageTransaction, setAverageTransaction] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [userId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration - replace with actual API calls
      const mockSpendingData = [
        { category: 'Groceries', amount: 520, percentage: 22 },
        { category: 'Dining', amount: 380, percentage: 16 },
        { category: 'Transportation', amount: 450, percentage: 19 },
        { category: 'Entertainment', amount: 290, percentage: 12 },
        { category: 'Utilities', amount: 280, percentage: 12 },
        { category: 'Other', amount: 280, percentage: 19 },
      ]

      const mockMonthlyTrends = [
        { month: 'Jan', spending: 1800, income: 4500 },
        { month: 'Feb', spending: 2100, income: 4500 },
        { month: 'Mar', spending: 1950, income: 4500 },
        { month: 'Apr', spending: 2200, income: 4500 },
        { month: 'May', spending: 2050, income: 4500 },
        { month: 'Jun', spending: 2300, income: 4500 },
      ]

      setSpendingByCategory(mockSpendingData)
      setMonthlyTrends(mockMonthlyTrends)
      setTotalSpending(mockSpendingData.reduce((sum, item) => sum + item.amount, 0))
      setAverageTransaction(totalSpending / 45) // Mock calculation
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0066cc', '#00a8e8', '#00d4ff', '#90e0ef', '#caf0f8', '#e0f7ff']

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-foreground">Financial Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-muted">
          <div className="text-sm text-muted-foreground">Total Spending</div>
          <div className="text-2xl font-bold text-foreground">${totalSpending.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">Last 6 months</div>
        </Card>
        <Card className="p-4 bg-muted">
          <div className="text-sm text-muted-foreground">Avg Transaction</div>
          <div className="text-2xl font-bold text-foreground">${averageTransaction.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">Per transaction</div>
        </Card>
        <Card className="p-4 bg-muted">
          <div className="text-sm text-muted-foreground">Monthly Budget</div>
          <div className="text-2xl font-bold text-foreground">$4,500</div>
          <div className="text-xs text-muted-foreground mt-2">Remaining</div>
        </Card>
        <Card className="p-4 bg-muted">
          <div className="text-sm text-muted-foreground">Savings Rate</div>
          <div className="text-2xl font-bold text-primary">42%</div>
          <div className="text-xs text-muted-foreground mt-2">Of income</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="p-6 bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Income vs Spending Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="spending" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Spending by Category */}
        <Card className="p-6 bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendingByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {spendingByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6 bg-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingByCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
            <Bar dataKey="amount" fill="#0066cc" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Spending Insights */}
      <Card className="p-6 bg-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insights & Recommendations</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Dining spending up 15%</span> compared to last month. Consider setting a weekly limit.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Savings goal on track:</span> Emergency Fund is 76% complete. Continue current contributions.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Highest spending day:</span> Friday with average transactions of $85 each.
            </div>
          </li>
        </ul>
      </Card>
    </div>
  )
}
