"use client"

import { useState } from "react"
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { TrendingDown, DollarSign, Calendar, Filter, Download, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBanking } from "@/lib/banking-context"

export function SpendingAnalysisView() {
  const { transactions, getSpendingByCategory } = useBanking()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month")

  const currentDate = new Date()
  const spendingData = getSpendingByCategory?.(selectedMonth, selectedYear) || []

  // Calculate monthly spending for the year
  const monthlyData = []
  for (let i = 0; i < 12; i++) {
    const spending = getSpendingByCategory?.(i, selectedYear) || []
    const total = spending.reduce((acc: number, item: any) => acc + item.amount, 0)
    monthlyData.push({
      month: new Date(selectedYear, i).toLocaleString("default", { month: "short" }),
      spending: total,
    })
  }

  // Category colors
  const categoryColors: Record<string, string> = {
    "Food & Drink": "#FF8C42",
    "Bills & Utilities": "#3B82F6",
    Shopping: "#A855F7",
    Entertainment: "#EC4899",
    Transportation: "#10B981",
    Transfers: "#6B7280",
    Income: "#34D399",
    Savings: "#06B6D4",
  }

  const COLORS = Object.values(categoryColors)

  const totalSpending = spendingData.reduce((acc: number, item: any) => acc + item.amount, 0)
  const highestCategory = spendingData.length > 0 ? spendingData.reduce((prev: any, current: any) => current.amount > prev.amount ? current : prev) : null
  const averageSpending = spendingData.length > 0 ? totalSpending / spendingData.length : 0

  // Year options
  const years = [selectedYear - 2, selectedYear - 1, selectedYear]

  // Month options
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ]

  return (
    <div className="w-full space-y-6 p-6 pb-24 touch-pan-y overscroll-contain">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Spending Analysis</h1>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block mb-2">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block mb-2">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block mb-2">Time Range</label>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">${totalSpending.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average per Category</p>
                <p className="text-2xl font-bold">${averageSpending.toFixed(2)}</p>
              </div>
              <Filter className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold">{highestCategory?.category || "N/A"}</p>
                <p className="text-sm text-muted-foreground">${highestCategory?.amount.toFixed(2) || "0"}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{spendingData.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {spendingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {spendingData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {spendingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Yearly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="spending" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {spendingData.length > 0 ? (
            <div className="space-y-3">
              {spendingData.map((item: any, index: number) => {
                const percentage = totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[item.category] || COLORS[index % COLORS.length] }} />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: categoryColors[item.category] || COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No spending data available for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
