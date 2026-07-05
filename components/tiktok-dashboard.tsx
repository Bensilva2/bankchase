'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Target, DollarSign, ShoppingCart, Bell, RefreshCw, Mail, CheckCircle, AlertCircle } from 'lucide-react'

export function TikTokDashboard() {
  const [tiktokData, setTiktokData] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch TikTok data from API
  const fetchTiktokData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tiktok-data?type=all')
      const result = await response.json()
      if (result.success) {
        setTiktokData(result.data)
        setLastUpdated(new Date().toLocaleTimeString())
        console.log('[v0] TikTok data updated:', result.data)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch TikTok data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh data manually
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/tiktok-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh-all' }),
      })
      const result = await response.json()
      if (result.success) {
        setTiktokData(result.data)
        setLastUpdated(new Date().toLocaleTimeString())
        console.log('[v0] TikTok data refreshed:', result.data)
      }
    } catch (error) {
      console.error('[v0] Failed to refresh TikTok data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Fetch data on mount and set up refresh interval
  useEffect(() => {
    fetchTiktokData()
    const interval = setInterval(fetchTiktokData, 30000)
    return () => clearInterval(interval)
  }, [fetchTiktokData])

  const stats = tiktokData?.stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageROI: 0,
    leadCount: 0,
  }

  const campaigns = tiktokData?.campaigns || []
  const leads = tiktokData?.leads || []
  const catalogs = tiktokData?.catalogs || []
  const performance = tiktokData?.performance || []

  const statCards = [
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Spent',
      value: `$${(stats.totalSpent / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Conversions',
      value: stats.totalConversions,
      icon: CheckCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Avg ROI',
      value: `${stats.averageROI?.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Leads',
      value: stats.leadCount,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">TikTok Ads Manager</h1>
              <p className="text-muted-foreground">Chase0613 Account</p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="text-muted-foreground text-sm">
                  Last updated: <span className="font-semibold text-primary">{lastUpdated}</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {['overview', 'campaigns', 'leads', 'catalogs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.label} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                          <div className={`${stat.bgColor} p-2 rounded-lg`}>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Performance */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>7-day trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                        <XAxis dataKey="date" stroke="oklch(0.65 0 0)" />
                        <YAxis stroke="oklch(0.65 0 0)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(0.13 0 0)',
                            border: '1px solid oklch(0.22 0 0)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="conversions" stroke="oklch(0.63 0.21 187)" strokeWidth={2} />
                        <Line type="monotone" dataKey="clicks" stroke="oklch(0.68 0.2 32)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Spend by Campaign */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Top Campaigns by Spend</CardTitle>
                    <CardDescription>Current budget allocation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={campaigns.slice(0, 3)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                        <XAxis dataKey="name" stroke="oklch(0.65 0 0)" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="oklch(0.65 0 0)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(0.13 0 0)',
                            border: '1px solid oklch(0.22 0 0)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Bar dataKey="spent" fill="oklch(0.63 0.21 187)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Total Impressions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {(stats.totalImpressions / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Across all active campaigns</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-400" />
                      CTR (Click-Through Rate)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">
                      {((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Engagement metric</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                      CPC (Cost Per Click)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-400">
                      ${(stats.totalSpent / stats.totalClicks).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Average cost efficiency</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
              <div className="grid grid-cols-1 gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {campaign.id}</p>
                        </div>
                        <Badge
                          className={`${
                            campaign.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-400'
                              : campaign.status === 'PAUSED'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-secondary/20 text-muted-foreground'
                          }`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-muted-foreground text-xs">Budget</p>
                          <p className="text-lg font-bold text-foreground">${campaign.budget}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Spent</p>
                          <p className="text-lg font-bold text-primary">${campaign.spent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Conversions</p>
                          <p className="text-lg font-bold text-green-400">{campaign.conversions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">ROI</p>
                          <p className="text-lg font-bold text-yellow-400">{campaign.roi}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget Used</span>
                          <span className="font-semibold text-foreground">{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${Math.min(100, (campaign.spent / campaign.budget) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Lead Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Campaign</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-foreground">{lead.name}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{lead.email}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{lead.campaignId}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`${
                              lead.status === 'CONVERTED'
                                ? 'bg-green-500/20 text-green-400'
                                : lead.status === 'QUALIFIED'
                                  ? 'bg-primary/20 text-blue-400'
                                  : lead.status === 'CONTACTED'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">${lead.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Catalogs Tab */}
          {activeTab === 'catalogs' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Product Catalogs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogs.map((catalog) => (
                  <Card key={catalog.id} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{catalog.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {catalog.id}</p>
                        </div>
                        <Badge
                          className={`${
                            catalog.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-secondary/20 text-muted-foreground'
                          }`}
                        >
                          {catalog.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Total Products</p>
                          <p className="text-2xl font-bold text-primary">{catalog.productCount}</p>
                        </div>
                        <ShoppingCart className="w-10 h-10 text-primary/30" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                        <p>Updated: {new Date(catalog.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
