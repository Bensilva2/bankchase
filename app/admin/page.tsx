'use client'

import { useState } from 'react'
import { Users, TrendingUp, AlertCircle, Settings, BarChart3, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  joinDate: string
  status: 'active' | 'pending' | 'inactive'
  accountType: 'checking' | 'savings' | 'premium'
  balance: number
}

interface AdminMetric {
  label: string
  value: string | number
  change: string
  icon: React.ReactNode
}

const userActivityData = [
  { date: 'Mon', signups: 24, transactions: 120, active: 87 },
  { date: 'Tue', signups: 13, transactions: 98, active: 92 },
  { date: 'Wed', signups: 32, transactions: 145, active: 110 },
  { date: 'Thu', signups: 28, transactions: 134, active: 105 },
  { date: 'Fri', signups: 35, transactions: 156, active: 118 },
  { date: 'Sat', signups: 22, transactions: 89, active: 94 },
  { date: 'Sun', signups: 18, transactions: 76, active: 81 },
]

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: '2024-01-15',
    status: 'active',
    accountType: 'premium',
    balance: 15234.56,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    joinDate: '2024-02-20',
    status: 'active',
    accountType: 'checking',
    balance: 8456.20,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    joinDate: '2024-03-10',
    status: 'pending',
    accountType: 'checking',
    balance: 0,
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    joinDate: '2024-01-01',
    status: 'inactive',
    accountType: 'savings',
    balance: 45000.00,
  },
]

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'settings'>('overview')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')

  const metrics: AdminMetric[] = [
    {
      label: 'Total Users',
      value: users.length,
      change: '+12% from last month',
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'active').length,
      change: '+5 this week',
      icon: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
    },
    {
      label: 'Total AUM',
      value: `$${users.reduce((sum, u) => sum + u.balance, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: '+$125K from last month',
      icon: <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    },
    {
      label: 'Pending Approvals',
      value: users.filter(u => u.status === 'pending').length,
      change: '2 awaiting review',
      icon: <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    },
  ]

  const filteredUsers = users.filter(user => 
    filterStatus === 'all' ? true : user.status === filterStatus
  )

  const handleApproveUser = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'active' as const } : u
    ))
    toast.success('User approved')
  }

  const handleDeactivateUser = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'inactive' as const } : u
    ))
    toast.success('User deactivated')
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId))
    toast.success('User removed from system')
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor system health, users, and transactions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(['overview', 'users', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-3 px-4 font-medium border-b-2 transition ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                    {metric.icon}
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.change}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity Chart */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-6">User Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={2} name="Signups" />
                    <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Transaction Volume Chart */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-6">Transaction Volume</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="transactions" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts Section */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-2xl p-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">System Alerts</h3>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li>• 2 users pending approval</li>
                    <li>• API response time increased 12% this week</li>
                    <li>• Database backup completed successfully</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background/50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">User</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Account Type</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Balance</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Joined</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-background/50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground capitalize">{user.accountType}</td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          ${user.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : user.status === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{user.joinDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.status === 'pending' && (
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="px-2 py-1 bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium transition"
                              >
                                Approve
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button
                                onClick={() => handleDeactivateUser(user.id)}
                                className="px-2 py-1 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs font-medium transition"
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="pb-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    System Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">Configure banking system parameters</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Daily Transaction Limit
                    </label>
                    <input
                      type="number"
                      defaultValue="50000"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum transfer amount per day</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Rate Limit
                    </label>
                    <input
                      type="number"
                      defaultValue="1000"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Requests per minute per user</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maintenance Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="w-5 h-5 rounded border-border"
                      />
                      <span className="text-sm text-muted-foreground">Enable maintenance mode</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      defaultValue="admin@chase.com"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex gap-3">
                  <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium">
                    Save Changes
                  </button>
                  <button className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
