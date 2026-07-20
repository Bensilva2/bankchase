'use client';

import { useState, useEffect, useCallback } from 'react';
;
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Send, ArrowRight, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
}

interface TransferStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  amount: number;
  fromAccount: string;
  toAccount: string;
  receiverName: string;
  timestamp: string;
  transactionId: string;
}

function TransferContent() {
  ;
  const searchParams = useSearchParams();
  const cardId = searchParams.get('cardId');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showReceiverForm, setShowReceiverForm] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<TransferStatus[]>([]);

  const [formData, setFormData] = useState({
    fromAccountId: '',
    receiverName: '',
    receiverBankAccount: '',
    receiverBankCode: 'INTERNAL',
    amount: '',
    narration: ''
  });

  const [transferResult, setTransferResult] = useState<TransferStatus | null>(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    if (!userId || !isLoaded) return;

    setIsLoadingAccounts(true);
    try {
      const response = await fetch(`/api/accounts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      
      // Pre-select first account if no card specified
      if (!cardId && data.accounts && data.accounts.length > 0) {
        setFormData(prev => ({ ...prev, fromAccountId: data.accounts[0].id }));
      }
    } catch (err) {
      console.error('[v0] Error fetching accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [userId, isLoaded, cardId]);

  // Fetch transfer history
  const fetchTransferHistory = useCallback(async () => {
    if (!userId || !isLoaded) return;

    try {
      const response = await fetch(`/api/transfers/status?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRecentTransfers(data.transfers || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching transfer history:', err);
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    fetchAccounts();
    fetchTransferHistory();
    // Refresh transfer history every 3 seconds for real-time updates
    const interval = setInterval(fetchTransferHistory, 3000);
    return () => clearInterval(interval);
  }, [fetchAccounts, fetchTransferHistory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateTransfer = (): boolean => {
    if (!formData.fromAccountId) {
      toast.error('Please select a source account');
      return false;
    }
    if (!formData.receiverName.trim()) {
      toast.error('Please enter receiver name');
      return false;
    }
    if (!formData.receiverBankAccount.trim()) {
      toast.error('Please enter receiver account number');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    const selectedAccount = accounts.find(a => a.id === formData.fromAccountId);
    if (selectedAccount && parseFloat(formData.amount) > selectedAccount.balance) {
      toast.error('Insufficient funds');
      return false;
    }

    return true;
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTransfer()) return;

    setIsTransferring(true);
    try {
      const response = await fetch('/api/transfers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: formData.fromAccountId,
          toAccountNumber: formData.receiverBankAccount,
          toBankCode: formData.receiverBankCode,
          amount: parseFloat(formData.amount),
          narration: formData.narration || `Transfer to ${formData.receiverName}`,
          recipientName: formData.receiverName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      // Show result
      const result: TransferStatus = {
        id: data.transaction?.id || '',
        status: data.status === 'processing' ? 'processing' : 'pending',
        amount: parseFloat(formData.amount),
        fromAccount: formData.fromAccountId,
        toAccount: formData.receiverBankAccount,
        receiverName: formData.receiverName,
        timestamp: new Date().toISOString(),
        transactionId: data.transaction?.id || ''
      };

      setTransferResult(result);
      toast.success('Transfer initiated successfully');

      // Reset form
      setFormData({
        fromAccountId: formData.fromAccountId,
        receiverName: '',
        receiverBankAccount: '',
        receiverBankCode: 'INTERNAL',
        amount: '',
        narration: ''
      });

      // Refresh transfer history
      setTimeout(fetchTransferHistory, 2000);

      // Refresh accounts to update balance
      setTimeout(fetchAccounts, 2000);
    } catch (error: any) {
      console.error('[v0] Transfer error:', error);
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Send Money</h1>
          <p className="text-muted-foreground">Transfer funds to bank accounts instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <form onSubmit={handleTransfer} className="space-y-6">
                {/* Source Account Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    From Account *
                  </label>
                  {isLoadingAccounts ? (
                    <div className="p-4 text-center text-muted-foreground">Loading accounts...</div>
                  ) : (
                    <select
                      name="fromAccountId"
                      value={formData.fromAccountId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select an account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountType} - {account.accountNumber} (${account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Receiver Information */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Receiver Information
                  </h3>

                  <div className="space-y-4">
                    {/* Receiver Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Receiver Name *
                      </label>
                      <input
                        type="text"
                        name="receiverName"
                        value={formData.receiverName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Receiver Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bank Account Number *
                      </label>
                      <input
                        type="text"
                        name="receiverBankAccount"
                        value={formData.receiverBankAccount}
                        onChange={handleInputChange}
                        placeholder="0123456789"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Bank Code */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bank Code
                      </label>
                      <select
                        name="receiverBankCode"
                        value={formData.receiverBankCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="INTERNAL">Internal Transfer</option>
                        <option value="SWIFT">International (SWIFT)</option>
                        <option value="ACH">ACH Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-4">Transfer Details</h3>

                  <div className="space-y-4">
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Amount (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-foreground">$</span>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Narration */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        name="narration"
                        value={formData.narration}
                        onChange={handleInputChange}
                        placeholder="Add a description for this transfer"
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isTransferring || isLoadingAccounts}
                  className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isTransferring ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Money
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Recent Transfers */}
          <div>
            {/* Transfer Result Alert */}
            {transferResult && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-200">Transfer Initiated</h4>
                    <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                      ${transferResult.amount.toFixed(2)} sent to {transferResult.receiverName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferResult(null)}
                  className="text-xs underline text-green-700 dark:text-green-300 hover:opacity-80"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Recent Transfers */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transfers</h3>

              {recentTransfers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent transfers
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="p-3 bg-muted/30 border border-border/50 rounded-lg hover:border-primary/50 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(transfer.status)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {transfer.receiverName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transfer.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground">
                            ${transfer.amount.toFixed(2)}
                          </p>
                          <p className={`text-xs capitalize ${getStatusColor(transfer.status)}`}>
                            {transfer.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link href="/transactions" className="block mt-4">
                <button className="w-full text-sm text-primary hover:underline py-2">
                  View All Transactions →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TransferPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <TransferContent />
    </ProtectedRoute>
  );
}
