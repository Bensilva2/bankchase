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
  ScatterChart,
  Scatter,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Bike, Activity, MapPin, BarChart3, Clock } from 'lucide-react'

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

const startsbyHourData = [
  { hour: '12 AM', starts: 45, x: 0, y: 45 },
  { hour: '1 AM', starts: 38, x: 1, y: 38 },
  { hour: '2 AM', starts: 32, x: 2, y: 32 },
  { hour: '3 AM', starts: 28, x: 3, y: 28 },
  { hour: '4 AM', starts: 35, x: 4, y: 35 },
  { hour: '5 AM', starts: 52, x: 5, y: 52 },
  { hour: '6 AM', starts: 145, x: 6, y: 145 },
  { hour: '7 AM', starts: 280, x: 7, y: 280 },
  { hour: '8 AM', starts: 420, x: 8, y: 420 },
  { hour: '9 AM', starts: 385, x: 9, y: 385 },
  { hour: '10 AM', starts: 320, x: 10, y: 320 },
  { hour: '11 AM', starts: 380, x: 11, y: 380 },
  { hour: '12 PM', starts: 480, x: 12, y: 480 },
  { hour: '1 PM', starts: 520, x: 13, y: 520 },
  { hour: '2 PM', starts: 485, x: 14, y: 485 },
  { hour: '3 PM', starts: 490, x: 15, y: 490 },
  { hour: '4 PM', starts: 580, x: 16, y: 580 },
  { hour: '5 PM', starts: 620, x: 17, y: 620 },
  { hour: '6 PM', starts: 550, x: 18, y: 550 },
  { hour: '7 PM', starts: 420, x: 19, y: 420 },
  { hour: '8 PM', starts: 340, x: 20, y: 340 },
  { hour: '9 PM', starts: 280, x: 21, y: 280 },
  { hour: '10 PM', starts: 200, x: 22, y: 200 },
  { hour: '11 PM', starts: 120, x: 23, y: 120 },
]

const stationsMapData = [
  { id: 1, name: 'Streeter Dr & Grand Ave', lat: 41.8927, lng: -87.6233, trips: 2850, active: true, x: 65, y: 35 },
  { id: 2, name: 'Michigan Ave & Oak St', lat: 41.8961, lng: -87.6279, trips: 2640, active: true, x: 62, y: 32 },
  { id: 3, name: 'Clark St & Elm St', lat: 41.9029, lng: -87.6312, trips: 2420, active: true, x: 60, y: 28 },
  { id: 4, name: 'Broadway & Barry Ave', lat: 41.9372, lng: -87.6458, trips: 2180, active: true, x: 55, y: 18 },
  { id: 5, name: 'Lakefront Trail & Navy Pier', lat: 41.8835, lng: -87.6161, trips: 1950, active: true, x: 70, y: 40 },
  { id: 6, name: 'Millennium Park', lat: 41.8829, lng: -87.6233, trips: 1820, active: true, x: 65, y: 42 },
  { id: 7, name: 'Maggie Daley Park', lat: 41.8825, lng: -87.6256, trips: 1650, active: false, x: 64, y: 43 },
  { id: 8, name: 'Art Institute of Chicago', lat: 41.8764, lng: -87.6244, trips: 1420, active: true, x: 65, y: 50 },
  { id: 9, name: 'Willis Tower', lat: 41.8789, lng: -87.6359, trips: 1380, active: true, x: 59, y: 48 },
  { id: 10, name: 'Union Station', lat: 41.8781, lng: -87.6298, trips: 1290, active: true, x: 62, y: 49 },
]

const topStationsData = [
  { name: 'Streeter Dr & Grand Ave', trips: 2850, usage: 95, growth: '+12.5%' },
  { name: 'Michigan Ave & Oak St', trips: 2640, usage: 88, growth: '+9.2%' },
  { name: 'Clark St & Elm St', trips: 2420, usage: 81, growth: '+7.8%' },
  { name: 'Broadway & Barry Ave', trips: 2180, usage: 73, growth: '+5.4%' },
  { name: 'Lakefront Trail & Navy Pier', trips: 1950, usage: 65, growth: '+3.2%' },
  { name: 'Millennium Park', trips: 1820, usage: 61, growth: '+2.1%' },
  { name: 'Maggie Daley Park', trips: 1650, usage: 55, growth: '-1.5%' },
  { name: 'Art Institute of Chicago', trips: 1420, usage: 47, growth: '+0.8%' },
]

const peakHoursData = [
  { hour: '8 AM', trips: 230 },
  { hour: '9 AM', trips: 320 },
  { hour: '12 PM', trips: 480 },
  { hour: '1 PM', trips: 520 },
  { hour: '5 PM', trips: 620 },
  { hour: '6 PM', trips: 550 },
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
  const [activeView, setActiveView] = useState('overview')

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'map', label: 'Stations Map', icon: MapPin },
    { id: 'ranking', label: 'Station Ranking', icon: BarChart3 },
    { id: 'hourly', label: 'Starts by Hour', icon: Clock },
  ]

  // Overview View
  const renderOverview = () => (
    <div className="w-full h-full overflow-auto">
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
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
                  {topStationsData.slice(0, 5).map((station, idx) => (
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
    </div>
  )

  // Stations Map View
  const renderMap = () => (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        
        {/* Map placeholder with stations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl">
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ background: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%231a1a1a%27 width=%27100%27 height=%27100%27/%3E%3C/svg%3E")' }}>
              {/* Grid background */}
              <defs>
                <radialGradient id="stationGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgb(26, 188, 156)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="rgb(26, 188, 156)" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              
              {stationsMapData.map((station) => (
                <circle
                  key={station.id}
                  cx={station.x}
                  cy={station.y}
                  r={Math.max(1.5, station.trips / 1000)}
                  fill={station.active ? 'url(#stationGradient)' : 'rgba(155, 89, 182, 0.5)'}
                  stroke={station.active ? 'rgb(26, 188, 156)' : 'rgba(155, 89, 182, 0.8)'}
                  strokeWidth="0.5"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  opacity="0.7"
                />
              ))}
            </svg>

            {/* Station labels overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-2 text-center max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold text-primary mb-4">Chicago Divvy Stations</h3>
                {stationsMapData.map((station) => (
                  <div key={station.id} className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <span className="text-primary font-semibold">{station.name}</span>: {station.trips} trips
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map legend */}
      <div className="bg-card border-t border-border p-4 text-sm text-muted-foreground">
        <p className="text-primary font-semibold mb-2">Map Legend</p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary/50 border border-primary" />
            <span>Active Station</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600/50 border border-purple-600" />
            <span>Inactive Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Circle size = Trip volume</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Station Ranking View
  const renderRanking = () => (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Station Performance Ranking</h2>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Rank</th>
                      <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Station Name</th>
                      <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Trips</th>
                      <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Usage Rate</th>
                      <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStationsData.map((station, idx) => {
                      const isGrowthPositive = station.growth.startsWith('+')
                      return (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium">{station.name}</td>
                          <td className="py-4 px-4 text-right">{station.trips.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${station.usage}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-primary">{station.usage}%</span>
                            </div>
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${isGrowthPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {station.growth}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Starts by Hour View
  const renderHourly = () => (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Bike Starts by Hour</h2>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={startsbyHourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                  <XAxis dataKey="hour" stroke="oklch(0.65 0 0)" />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.13 0 0)',
                      border: '1px solid oklch(0.22 0 0)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => [`${value} starts`, 'Trips']}
                  />
                  <Bar dataKey="starts" fill="oklch(0.63 0.21 187)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm mb-1">Peak Hour</p>
                    <p className="text-2xl font-bold text-primary">5 PM</p>
                    <p className="text-sm text-muted-foreground mt-1">620 trips</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm mb-1">Average Starts/Hour</p>
                    <p className="text-2xl font-bold text-primary">357</p>
                    <p className="text-sm text-muted-foreground mt-1">24-hour average</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm mb-1">Lowest Activity</p>
                    <p className="text-2xl font-bold text-primary">3 AM</p>
                    <p className="text-sm text-muted-foreground mt-1">28 trips</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground">
      {/* Header with navigation tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Top Stations Activity Dashboard</h1>
            <div className="text-muted-foreground text-sm">
              Time Range: <span className="font-semibold text-primary">{timeRange}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeView === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Time Range Filter - only show on overview */}
          {activeView === 'overview' && (
            <div className="flex gap-2">
              {['24h', '7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Content - fills remaining space */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'map' && renderMap()}
        {activeView === 'ranking' && renderRanking()}
        {activeView === 'hourly' && renderHourly()}
      </div>
    </div>
  )
}
