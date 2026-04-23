/**
 * Admin Transfer Form - Handle admin-to-user fund transfers with OTP verification
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AdminTransferFormProps {
  users: any[]
  onSuccess?: () => void
}

export default function AdminTransferForm({ users, onSuccess }: AdminTransferFormProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [transferId, setTransferId] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUser = users.find((u) => u.id === selectedUser)
  const currentAccount = currentUser?.accounts?.find((a: any) => a.id === selectedAccount)

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedUser || !selectedAccount || !amount) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          action: 'initiate',
          toUserId: selectedUser,
          toAccountId: selectedAccount,
          amount: parseFloat(amount),
          description:
            description || `Admin credit to ${currentAccount?.name || 'account'}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to initiate transfer')
        return
      }

      setTransferId(data.transferId)
      setStep('otp')
      setSuccess('OTP has been sent. Please enter it to confirm the transfer.')
    } catch (err) {
      setError('Error initiating transfer. Please try again.')
      console.error('[v0] Transfer initiation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!otp) {
      setError('Please enter the OTP')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          action: 'confirm',
          transferId,
          otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to confirm transfer')
        return
      }

      setSuccess(
        `Transfer of $${amount} completed successfully! New balance: $${data.newBalance}`
      )

      // Reset form
      setTimeout(() => {
        setSelectedUser('')
        setSelectedAccount('')
        setAmount('')
        setDescription('')
        setStep('details')
        setTransferId('')
        setOtp('')
        setSuccess('')
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError('Error confirming transfer. Please try again.')
      console.error('[v0] Transfer confirmation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      {step === 'details' ? (
        <form onSubmit={handleInitiateTransfer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value)
                  setSelectedAccount('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedUser}
              >
                <option value="">Choose an account...</option>
                {currentUser?.accounts?.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type}) - ${parseFloat(account.balance || 0).toFixed(2)} | Acct: {account.full_account_number || account.account_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Amount (USD)
            </label>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Welcome bonus, account opening credit..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            {loading ? 'Processing...' : 'Initiate Transfer'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleConfirmTransfer} className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Transfer Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-medium">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account:</span>
                <span className="font-medium">{currentAccount?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">${amount}</span>
              </div>
            </div>
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Verification Code (OTP)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl letter-spacing tracking-widest"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Check your email for the 6-digit code
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('details')
                setOtp('')
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
            >
              {loading ? 'Confirming...' : 'Confirm Transfer'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
