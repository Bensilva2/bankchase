'use client'

import { useState } from 'react'
import { Send, Search, Loader, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ZelleRecipient {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  isFavorite: boolean
}

interface ZellePaymentProps {
  accounts: Array<{ id: string; account_number: string; balance: number; account_type: string }>
  onSuccess?: () => void
}

export function ZellePayment({ accounts, onSuccess }: ZellePaymentProps) {
  const [step, setStep] = useState<'recipient' | 'amount' | 'review' | 'confirm'>('recipient')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<ZelleRecipient | null>(null)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<ZelleRecipient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Mock recent recipients
  const recentRecipients: ZelleRecipient[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '(555) 123-4567', isFavorite: true },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '(555) 987-6543', isFavorite: true },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '(555) 456-7890', isFavorite: false },
  ]

  const handleSearchRecipient = async (query: string) => {
    setRecipientSearch(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Simulate API search
      await new Promise((resolve) => setTimeout(resolve, 500))
      const results = recentRecipients.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.email.toLowerCase().includes(query.toLowerCase()) ||
          r.phone.includes(query)
      )
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectRecipient = (recipient: ZelleRecipient) => {
    setSelectedRecipient(recipient)
    setRecipientSearch('')
    setSearchResults([])
    setStep('amount')
  }

  const handleSubmitPayment = async () => {
    if (!selectedRecipient || !amount || !selectedAccount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Payment sent successfully')
      onSuccess?.()
      // Reset form
      setStep('recipient')
      setSelectedRecipient(null)
      setAmount('')
      setMemo('')
    } catch (error) {
      toast.error('Failed to send payment')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'recipient') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Send Money with Zelle</h3>
          <p className="text-muted-foreground">Instant, secure payments to friends and family</p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number"
            value={recipientSearch}
            onChange={(e) => handleSearchRecipient(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {isSearching && (
            <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          )}
        </div>

        {/* Search Results or Recent Recipients */}
        {recipientSearch && searchResults.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Search Results</p>
            {searchResults.map((recipient) => (
              <button
                key={recipient.id}
                onClick={() => handleSelectRecipient(recipient)}
                className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left"
              >
                <p className="font-medium text-foreground">{recipient.name}</p>
                <p className="text-sm text-muted-foreground">{recipient.email}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Recent Recipients</p>
            {recentRecipients.map((recipient) => (
              <button
                key={recipient.id}
                onClick={() => handleSelectRecipient(recipient)}
                className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{recipient.name}</p>
                  <p className="text-sm text-muted-foreground">{recipient.email}</p>
                </div>
                {recipient.isFavorite && <span className="text-primary">★</span>}
              </button>
            ))}
          </div>
        )}

        {/* New Recipient Option */}
        <button className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left">
          <p className="font-medium text-foreground flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">+</span>
            Add New Recipient
          </p>
          <p className="text-sm text-muted-foreground">Enter email, phone or Zelle ID</p>
        </button>
      </div>
    )
  }

  if (step === 'amount') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Send Amount</h3>
          <p className="text-muted-foreground">To {selectedRecipient?.name}</p>
        </div>

        <div className="p-4 bg-background border border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Recipient</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{selectedRecipient?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedRecipient?.email}</p>
            </div>
            <button
              onClick={() => {
                setSelectedRecipient(null)
                setStep('recipient')
              }}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground text-2xl font-bold">
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* From Account */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">From Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_type} - {acc.account_number} (${acc.balance.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Note (Optional)</label>
          <input
            type="text"
            placeholder="What is this payment for?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep('recipient')}
            className="flex-1 py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
          >
            Back
          </button>
          <button
            onClick={() => setStep('review')}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Review Payment</h3>
        </div>

        {/* Summary */}
        <div className="p-6 bg-background border border-border rounded-lg space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-muted-foreground">To</span>
            <div className="text-right">
              <p className="font-semibold text-foreground">{selectedRecipient?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedRecipient?.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-border">
            <span className="text-muted-foreground">Amount</span>
            <p className="text-2xl font-bold text-foreground">${amount}</p>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-border">
            <span className="text-muted-foreground">From Account</span>
            <p className="text-foreground font-medium">
              {accounts.find((a) => a.id === selectedAccount)?.account_number}
            </p>
          </div>

          {memo && (
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground">Note</span>
              <p className="text-foreground">{memo}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg flex gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>Instant:</strong> Money will be available immediately to {selectedRecipient?.name}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep('amount')}
            className="flex-1 py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
          >
            Back
          </button>
          <button
            onClick={() => setStep('confirm')}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
          >
            Send Money
          </button>
        </div>
      </div>
    )
  }

  // Confirm step
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        {isLoading ? (
          <Loader className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Check className="w-8 h-8 text-primary" />
        )}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {isLoading ? 'Sending Money...' : 'Money Sent!'}
        </h3>
        <p className="text-muted-foreground">
          {isLoading
            ? 'Your payment is being processed'
            : `$${amount} sent to ${selectedRecipient?.name}`}
        </p>
      </div>

      {!isLoading && (
        <>
          <div className="p-4 bg-background border border-border rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-medium text-foreground">{selectedRecipient?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-foreground">${amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-sm text-foreground">ZEL-20250507-001</span>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('recipient')
              setSelectedRecipient(null)
              setAmount('')
              setMemo('')
              onSuccess?.()
            }}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
          >
            Send Another Payment
          </button>
        </>
      )}
    </div>
  )
}
