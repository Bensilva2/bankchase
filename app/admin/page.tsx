/**
 * Admin Dashboard - Real-time fund transfer management
 * Only accessible to admin users
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminTransferForm from '@/components/admin/admin-transfer-form'
import AdminUsersList from '@/components/admin/admin-users-list'
import AdminTransferHistory from '@/components/admin/admin-transfer-history'

interface NewUser {
  id: string
  email: string
  name: string
  created_at: string
  accounts: any[]
}

interface AdminTransfer {
  id: string
  user_id: string
  account_id: string
  amount: number
  status: string
  created_at: string
  confirmed_at?: string
  users?: { id: string; email: string; name: string }
  accounts?: { id: string; name: string; type: string }
}

export default function AdminDashboard() {
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [pendingTransfers, setPendingTransfers] = useState<AdminTransfer[]>([])
  const [transferHistory, setTransferHistory] = useState<AdminTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'new-users' | 'pending' | 'history'>('new-users')
  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData()
    setupRealtimeListeners()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const adminHeaders = {
        'Content-Type': 'application/json',
        'x-user-id': 'admin',
        'x-user-role': 'admin',
      }

      // Fetch all users with their accounts (not just 24h)
      const allUsersRes = await fetch('/api/admin/users', {
        method: 'GET',
        headers: adminHeaders,
      })

      if (allUsersRes.ok) {
        const data = await allUsersRes.json()
        setNewUsers(data.users || [])
      }

      // Fetch pending transfers
      const pendingRes = await fetch('/api/admin/users', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'get-pending-transfers' }),
      })

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingTransfers(data.transfers || [])
      }

      // Fetch transfer history
      const historyRes = await fetch('/api/admin/transfers', {
        headers: adminHeaders,
      })
      if (historyRes.ok) {
        const data = await historyRes.json()
        setTransferHistory(data.transfers || [])
      }
    } catch (error) {
      console.error('[v0] Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeListeners = () => {
    // Subscribe to admin_transfers changes
    const transfersChannel = supabase
      .channel('admin_transfers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_transfers',
        },
        (payload: any) => {
          console.log('[v0] Transfer update:', payload)
          fetchDashboardData()
        }
      )
      .subscribe()

    // Subscribe to new users
    const usersChannel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        (payload: any) => {
          console.log('[v0] New user registered:', payload)
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transfersChannel)
      supabase.removeChannel(usersChannel)
    }
  }

  const handleTransferSuccess = () => {
    fetchDashboardData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and fund transfers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{newUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Transfers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingTransfers.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed Transfers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {transferHistory.filter((t) => t.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('new-users')}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition ${
                activeTab === 'new-users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Users ({newUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Transfers ({pendingTransfers.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transfer History
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading dashboard data...</p>
              </div>
            ) : activeTab === 'new-users' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recently Registered Users
                </h2>
                <AdminUsersList users={newUsers} />
              </>
            ) : activeTab === 'pending' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Transfer Funds to New Account
                </h2>
                <AdminTransferForm users={newUsers} onSuccess={handleTransferSuccess} />
                {pendingTransfers.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Pending Transfers Awaiting Confirmation
                    </h3>
                    <AdminTransferHistory transfers={pendingTransfers} />
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Transfer History
                </h2>
                <AdminTransferHistory transfers={transferHistory} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
