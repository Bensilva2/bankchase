'use client'

import { useState } from 'react'
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
import { TrendingUp, Users, Bike, Activity } from 'lucide-react'

// Mock data for Divvy stations
const stationActivityData = [
  { time: '12:00 AM', pickups: 45, dropoffs: 52 },
  { time: '4:00 AM', pickups: 28, dropoffs: 35 },
  { time: '8:00 AM', pickups: 230, dropoffs: 180 },
  { time: '12:00 PM', pickups: 480, dropoffs: 450 },
  { time: '4:00 PM', pickups: 520, dropoffs: 580 },
  { time: '8:00 PM', pickups: 420, dropoffs: 510 },
  { time: '11:00 PM', pickups: 180, dropoffs: 200 },
]

const topStationsData = [
  { name: 'Streeter Dr & Grand Ave', trips: 2850, usage: 95 },
  { name: 'Michigan Ave & Oak St', trips: 2640, usage: 88 },
  { name: 'Clark St & Elm St', trips: 2420, usage: 81 },
  { name: 'Broadway & Barry Ave', trips: 2180, usage: 73 },
  { name: 'Lakefront Trail & Navy Pier', trips: 1950, usage: 65 },
]

const peakHoursData = [
  { hour: '8 AM', trips: 230 },
  { hour: '9 AM', trips: 320 },
  { hour: '5 PM', trips: 520 },
  { hour: '6 PM', trips: 480 },
  { hour: '7 PM', trips: 420 },
]

const stationTypeData = [
  { name: 'Downtown', value: 45, color: 'oklch(0.63 0.21 187)' },
  { name: 'Residential', value: 28, color: 'oklch(0.68 0.2 32)' },
  { name: 'Waterfront', value: 15, color: 'oklch(0.72 0.15 285)' },
  { name: 'Lakefront', value: 12, color: 'oklch(0.65 0.18 120)' },
]

const COLORS = ['#1abc9c', '#f39c12', '#e74c3c', '#9b59b6']

export function DivvyDashboard() {
  const [timeRange, setTimeRange] = useState('7d')

  const stats = [
    {
      label: 'Total Trips',
      value: '18.5K',
      change: '+12.5%',
      icon: Bike,
      trend: 'up',
    },
    {
      label: 'Active Stations',
      value: '587',
      change: '+2.4%',
      icon: Activity,
      trend: 'up',
    },
    {
      label: 'Peak Hour Users',
      value: '1.2K',
      change: '-3.2%',
      icon: Users,
      trend: 'down',
    },
    {
      label: 'Avg Trip Duration',
      value: '18m',
      change: '+5.1%',
      icon: TrendingUp,
      trend: 'up',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Top Stations Activity Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time analytics for Divvy bike-sharing system performance
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            const isPositive = stat.trend === 'up'
            return (
              <Card
                key={stat.label}
                className="bg-card border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${
                      isPositive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {stat.change}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Over Time */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Pickups and dropoffs throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stationActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                  <XAxis dataKey="time" stroke="oklch(0.65 0 0)" />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.13 0 0)',
                      border: '1px solid oklch(0.22 0 0)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pickups"
                    stroke="oklch(0.63 0.21 187)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="dropoffs"
                    stroke="oklch(0.68 0.2 32)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Busiest times of the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                  <XAxis dataKey="hour" stroke="oklch(0.65 0 0)" />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.13 0 0)',
                      border: '1px solid oklch(0.22 0 0)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="trips" fill="oklch(0.63 0.21 187)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Stations */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle>Top Performing Stations</CardTitle>
              <CardDescription>Most active stations by trip count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStationsData.map((station, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{station.name}</p>
                      <p className="text-sm text-muted-foreground">{station.trips} trips</p>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${station.usage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary ml-3">{station.usage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Station Type Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Station Distribution</CardTitle>
              <CardDescription>By location type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stationTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#1abc9c"
                    dataKey="value"
                  >
                    {stationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.13 0 0)',
                      border: '1px solid oklch(0.22 0 0)',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
