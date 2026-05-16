'use client';

import React, { useState, useEffect } from 'react';
import { sendDemoTransfer, sendBulkDemoTransfer, getDemoTransferHistory, formatTransferForDisplay } from '@/lib/demo-transfer-service';

interface AdminDemoTransferProps {
  adminUserId: string;
}

export function AdminDemoTransfer({ adminUserId }: AdminDemoTransferProps) {
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [daysToRefund, setDaysToRefund] = useState('7');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('single');

  // Fetch transfer history
  const fetchHistory = async () => {
    setTransfersLoading(true);
    try {
      const data = await getDemoTransferHistory(adminUserId, { limit: 20 });
      setTransfers(data.transfers.map(formatTransferForDisplay));
    } catch (error) {
      console.error('[v0] Error fetching history:', error);
      setMessage('Failed to fetch transfer history');
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleSingleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await sendDemoTransfer({
        toAccountNumber,
        amount: parseFloat(amount),
        daysToRefund: parseInt(daysToRefund),
        adminUserId,
      });

      setMessage(`Success! Transfer ${result.transferReference} sent.`);
      setToAccountNumber('');
      setAmount('');
      setDaysToRefund('7');

      // Refresh history
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!amount) {
      setMessage('Please enter an amount');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await sendBulkDemoTransfer({
        amount: parseFloat(amount),
        daysToRefund: parseInt(daysToRefund),
        adminUserId,
      });

      setMessage(`Success! Sent ${result.amount} to ${result.totalUsers} users.`);
      setAmount('');
      setDaysToRefund('7');

      // Refresh history
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Demo Money Transfer</h2>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'single'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Single Transfer
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'bulk'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bulk Transfer
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transfer History
        </button>
      </div>

      {/* Single Transfer */}
      {activeTab === 'single' && (
        <form onSubmit={handleSingleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Recipient Account Number
            </label>
            <input
              type="text"
              value={toAccountNumber}
              onChange={(e) => setToAccountNumber(e.target.value)}
              placeholder="e.g., 1234567890"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (NGN)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Days Until Auto-Refund (for external accounts)
            </label>
            <select
              value={daysToRefund}
              onChange={(e) => setDaysToRefund(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Demo Money'}
          </button>
        </form>
      )}

      {/* Bulk Transfer */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
            Send demo money to ALL registered users at once.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount Per User (NGN)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              min="0"
              step="0.01"
            />
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          <button
            onClick={handleBulkTransfer}
            disabled={loading}
            className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send to All Users'}
          </button>
        </div>
      )}

      {/* Transfer History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {transfersLoading && <div className="text-center text-gray-600">Loading...</div>}

          {!transfersLoading && transfers.length === 0 && (
            <div className="text-center text-gray-600">No transfers yet</div>
          )}

          {!transfersLoading && transfers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-medium">Reference</th>
                    <th className="px-4 py-2 text-left font-medium">Account</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs">
                        {transfer.transfer_reference}
                      </td>
                      <td className="px-4 py-3">{transfer.to_account_number}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₦{transfer.amount.toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            transfer.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : transfer.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {transfer.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">{transfer.typeLabel}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
