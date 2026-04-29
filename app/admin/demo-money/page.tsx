'use client';

import { useState } from 'react';
import { useAdminStats, useAdminTransfers } from '@/hooks/useAdminStats';
import { useAccounts } from '@/hooks/useAccounts';
import ApiClient from '@/lib/api-client';
import { Send, Users, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DemoTransferPage() {
  const { stats, isLoading: statsLoading, mutate: mutateStats } = useAdminStats();
  const { transfers, mutate: mutateTransfers } = useAdminTransfers();
  const { accounts } = useAccounts();

  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [singleTransfer, setSingleTransfer] = useState({
    to_account_number: '',
    amount: '',
    to_bank_code: 'INTERNAL',
  });

  const handleSingleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTransfer.to_account_number || !singleTransfer.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsTransferLoading(true);
    try {
      await ApiClient.adminSingleTransfer({
        to_account_number: singleTransfer.to_account_number,
        amount: parseFloat(singleTransfer.amount),
        to_bank_code: singleTransfer.to_bank_code,
      });

      toast.success('Transfer sent successfully');
      setSingleTransfer({ to_account_number: '', amount: '', to_bank_code: 'INTERNAL' });
      mutateStats();
      mutateTransfers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send transfer');
    } finally {
      setIsTransferLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    const amount = prompt('Enter amount per user:');
    if (!amount) return;

    setIsTransferLoading(true);
    try {
      await ApiClient.adminBulkTransfer({
        amount: parseFloat(amount),
      });

      toast.success('Bulk transfer sent to all users');
      mutateStats();
      mutateTransfers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send bulk transfer');
    } finally {
      setIsTransferLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-background border border-border transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Demo Money Transfers</h1>
            <p className="text-muted-foreground">Manage virtual funds for testing and onboarding</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Transfers</h3>
              <Send className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '-' : stats?.total_transfers || 0}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${statsLoading ? '-' : (stats?.total_amount || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pending Refunds</h3>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {statsLoading ? '-' : stats?.pending_refunds || 0}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Recipients</h3>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '-' : stats?.unique_recipients || 0}
            </p>
          </div>
        </div>

        {/* Transfer Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Single Transfer */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Single Transfer</h2>

            <form onSubmit={handleSingleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="Account number"
                  value={singleTransfer.to_account_number}
                  onChange={(e) =>
                    setSingleTransfer({
                      ...singleTransfer,
                      to_account_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={singleTransfer.amount}
                    onChange={(e) =>
                      setSingleTransfer({ ...singleTransfer, amount: e.target.value })
                    }
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTransferLoading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
              >
                {isTransferLoading ? 'Processing...' : 'Send Transfer'}
              </button>
            </form>
          </div>

          {/* Bulk Transfer & Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Bulk Transfer</h2>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Send demo funds to all registered users in your organization.
                </p>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Total Users:</span> {accounts.length}
                  </p>
                </div>

                <button
                  onClick={handleBulkTransfer}
                  disabled={isTransferLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  {isTransferLoading ? 'Processing...' : 'Send to All Users'}
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">How It Works</h3>
              <ul className="space-y-3 text-sm text-green-700 dark:text-green-300">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-200 text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span><strong>Registered Users:</strong> Demo funds credited instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-200 text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span><strong>External Accounts:</strong> Funds appear as pending</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-200 text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span><strong>Auto-Refund:</strong> Pending funds refund after 7-14 days</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transfer History */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Transfers</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Account
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfers.length > 0 ? (
                  transfers.map((transfer: any) => (
                    <tr key={transfer.id} className="border-b border-border hover:bg-background/50 transition">
                      <td className="py-3 px-4 text-foreground">{transfer.to_account_number}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        ${transfer.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transfer.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : transfer.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(transfer.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No transfers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
