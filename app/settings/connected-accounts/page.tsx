'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, ExternalLink, ChevronDown, CheckCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { PlaidLink } from '@/components/plaid-link'
import { toast } from 'sonner'

interface LinkedAccount {
  id: string
  institution: string
  institutionId: string
  accounts: Array<{
    id: string
    name: string
    type: string
    subtype: string
    mask: string
    balance: number
  }>
  connectedAt: string
  lastSync: string
}

function ConnectedAccountsContent() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([
    {
      id: 'link_1',
      institution: 'Chase Bank',
      institutionId: 'ins_123456',
      accounts: [
        { id: 'acc_1', name: 'Checking Account', type: 'depository', subtype: 'checking', mask: '4242', balance: 5234.56 },
        { id: 'acc_2', name: 'Savings Account', type: 'depository', subtype: 'savings', mask: '5555', balance: 15000.00 },
      ],
      connectedAt: '2025-04-15',
      lastSync: '2 hours ago',
    },
  ])
  const [showPlaidLink, setShowPlaidLink] = useState(false)
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    const newAccount: LinkedAccount = {
      id: 'link_' + Date.now(),
      institution: metadata.institution.name,
      institutionId: metadata.institution.institution_id,
      accounts: metadata.accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        mask: acc.mask,
        balance: Math.random() * 20000,
      })),
      connectedAt: new Date().toISOString().split('T')[0],
      lastSync: 'Just now',
    }

    setLinkedAccounts([...linkedAccounts, newAccount])
    setShowPlaidLink(false)
    toast.success(`${metadata.institution.name} connected successfully`)
  }

  const handleDisconnect = (accountId: string) => {
    setLinkedAccounts(linkedAccounts.filter((acc) => acc.id !== accountId))
    toast.success('Account disconnected')
  }

  const handleRefreshData = async (accountId: string) => {
    setIsRefreshing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Data synced successfully')
      // Update lastSync time
      setLinkedAccounts(
        linkedAccounts.map((acc) =>
          acc.id === accountId ? { ...acc, lastSync: 'Just now' } : acc
        )
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Connected Accounts</h1>
          <p className="text-muted-foreground">Manage your linked bank accounts and external accounts</p>
        </div>

        {/* Connected Accounts List */}
        {linkedAccounts.length > 0 && (
          <div className="space-y-4 mb-8">
            {linkedAccounts.map((account) => (
              <div key={account.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Account Header */}
                <button
                  onClick={() =>
                    setExpandedAccount(expandedAccount === account.id ? null : account.id)
                  }
                  className="w-full p-6 hover:bg-background/50 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {account.institution}
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.accounts.length} account{account.accounts.length !== 1 ? 's' : ''} • 
                        Synced {account.lastSync}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition ${
                      expandedAccount === account.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                {expandedAccount === account.id && (
                  <div className="border-t border-border p-6 bg-background/50 space-y-4">
                    {/* Linked Accounts */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Linked Accounts</h3>
                      <div className="space-y-2">
                        {account.accounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="p-4 bg-card border border-border rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">{acc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {acc.type} • Ends in {acc.mask}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                ${acc.balance.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {acc.subtype}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Connection Info */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Connected Date</p>
                        <p className="font-medium text-foreground">{account.connectedAt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
                        <p className="font-medium text-foreground">{account.lastSync}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => handleRefreshData(account.id)}
                        disabled={isRefreshing}
                        className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Syncing...' : 'Refresh Data'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="flex-1 py-2 bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg transition font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Plaid Link Section */}
        {!showPlaidLink ? (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Add Another Account</h2>
            <p className="text-muted-foreground mb-6">
              Connect additional bank accounts from other financial institutions
            </p>
            <button
              onClick={() => setShowPlaidLink(true)}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
            >
              Connect New Account
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Connect New Account</h2>
            <PlaidLink
              onSuccess={handlePlaidSuccess}
              onExit={() => setShowPlaidLink(false)}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">How Connected Accounts Work</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex gap-2">
              <span>•</span>
              <span>View all your accounts in one dashboard</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Automatic balance and transaction updates</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>All data is encrypted and secure with Plaid</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>You can disconnect anytime without affecting your bank account</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default function ConnectedAccountsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <ConnectedAccountsContent />
    </ProtectedRoute>
  )
}
