'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { TrendingDown, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'

export default function SpendingAnalysisPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { getSpendingByCategory } = useBanking()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const spendingData = getSpendingByCategory ? getSpendingByCategory(currentMonth, currentYear) : []
  const totalSpending = spendingData.reduce((acc, item) => acc + item.amount, 0)

  const categoryColors: Record<string, string> = {
    'Food & Drink': 'bg-orange-500',
    'Bills & Utilities': 'bg-blue-500',
    'Shopping': 'bg-pink-500',
    'Transportation': 'bg-green-500',
    'Entertainment': 'bg-purple-500',
    'Healthcare': 'bg-red-500',
    'Subscriptions': 'bg-indigo-500',
    'Other': 'bg-gray-500',
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || 'bg-gray-500'
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Spending Analysis</h1>
            <p className="text-gray-600">See where your money is going</p>
          </div>
        </div>

        {/* Month Selector */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              ← Previous
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{months[currentMonth]} {currentYear}</p>
            </div>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Next →
            </button>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <TrendingDown className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-blue-100 text-sm mb-1">Total Spending</p>
            <p className="text-4xl font-bold">${totalSpending.toFixed(2)}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-600 to-green-800 text-white">
            <p className="text-green-100 text-sm mb-1">Largest Category</p>
            <p className="text-2xl font-bold">
              {spendingData.length > 0 ? spendingData[0]?.category : 'N/A'}
            </p>
            <p className="text-green-100 text-xs mt-2">
              ${spendingData.length > 0 ? spendingData[0]?.amount.toFixed(2) : '0.00'}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
            <p className="text-purple-100 text-sm mb-1">Categories</p>
            <p className="text-4xl font-bold">{spendingData.length}</p>
          </Card>
        </div>

        {/* Spending Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart View */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Breakdown</h2>
            <div className="space-y-4">
              {spendingData.length > 0 ? (
                spendingData.map((item: any, index: number) => {
                  const percentage = (item.amount / totalSpending) * 100
                  return (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <p className="font-medium text-gray-900">{item.category}</p>
                        <p className="text-gray-600">${item.amount.toFixed(2)} ({percentage.toFixed(1)}%)</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${getCategoryColor(item.category)} h-3 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-600 text-center py-8">No spending data for this period</p>
              )}
            </div>
          </Card>

          {/* Category List */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">By Category</h2>
            <div className="space-y-3">
              {spendingData.length > 0 ? (
                spendingData.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${getCategoryColor(item.category)}`}
                      ></div>
                      <p className="font-medium text-gray-900">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${item.amount.toFixed(2)}</p>
                      <p className="text-gray-600 text-sm">
                        {((item.amount / totalSpending) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Insights */}
        <Card className="mt-8 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-2">Highest Spending</p>
              <p className="text-xl font-bold text-blue-900">
                {spendingData.length > 0 ? spendingData[0]?.category : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium mb-2">Average Daily</p>
              <p className="text-xl font-bold text-green-900">
                ${(totalSpending / 30).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
