'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { TrendingUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import type { AccountWithBalance } from '@/hooks/use-account-management'

interface RealtimeAccountDashboardProps {
  accounts: AccountWithBalance[]
  isLoading: boolean
  onCreateAccount: (name: string, type: string, accountNumber: string, routingNumber: string) => Promise<void>
  onDeleteAccount: (accountId: string) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function RealtimeAccountDashboard({
  accounts,
  isLoading,
  onCreateAccount,
  onDeleteAccount,
}: RealtimeAccountDashboardProps) {
  const [showBalances, setShowBalances] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('checking')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newRoutingNumber, setNewRoutingNumber] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0)

  const handleCreateAccount = async () => {
    if (!newAccountName || !newAccountNumber) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)

    try {
      await onCreateAccount(newAccountName, newAccountType, newAccountNumber, newRoutingNumber)

      toast({
        title: 'Success',
        description: 'Account created successfully',
      })

      setNewAccountName('')
      setNewAccountNumber('')
      setNewRoutingNumber('')
      setActiveTab('overview')
    } catch (error) {
      console.error('[v0] Account creation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      await onDeleteAccount(accountId)
      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      })
    } catch (error) {
      console.error('[v0] Account deletion error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {showBalances ? formatCurrency(totalBalance) : '••••••'}
              </p>
            </div>
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Available Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {showBalances ? formatCurrency(totalAvailable) : '••••••'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Accounts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">My Accounts</TabsTrigger>
          <TabsTrigger value="add">Add Account</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500">Loading accounts...</p>
            </Card>
          ) : accounts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 mb-4">No accounts yet</p>
              <Button
                onClick={() => setActiveTab('add')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Your First Account
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <Card key={account.id} className="p-4 border-l-4 border-l-blue-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.type} • {account.accountNumber}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            account.syncStatus === 'synced'
                              ? 'bg-green-100 text-green-800'
                              : account.syncStatus === 'syncing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {account.syncStatus === 'synced' && '✓ Synced'}
                          {account.syncStatus === 'syncing' && '⟳ Syncing'}
                          {account.syncStatus === 'error' && '✗ Error'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Updated {new Date(account.lastUpdated).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {showBalances ? formatCurrency(account.balance) : '••••••'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Available: {showBalances ? formatCurrency(account.availableBalance) : '••••••'}
                      </p>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="mt-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Account Tab */}
        <TabsContent value="add">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Account
            </h3>

            <div>
              <Label htmlFor="account-name" className="text-sm font-medium text-gray-700">
                Account Name
              </Label>
              <Input
                id="account-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Emergency Fund"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="account-type" className="text-sm font-medium text-gray-700">
                Account Type
              </Label>
              <select
                id="account-type"
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="money-market">Money Market</option>
                <option value="cd">Certificate of Deposit</option>
              </select>
            </div>

            <div>
              <Label htmlFor="account-number" className="text-sm font-medium text-gray-700">
                Account Number
              </Label>
              <Input
                id="account-number"
                value={newAccountNumber}
                onChange={(e) => setNewAccountNumber(e.target.value)}
                placeholder="123456789"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="routing-number" className="text-sm font-medium text-gray-700">
                Routing Number
              </Label>
              <Input
                id="routing-number"
                value={newRoutingNumber}
                onChange={(e) => setNewRoutingNumber(e.target.value)}
                placeholder="021000021"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleCreateAccount}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Account'}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
