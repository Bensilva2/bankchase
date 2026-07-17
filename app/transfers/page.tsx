'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { CheckCircle, Clock, AlertCircle, TrendingDown, Download, Filter, Search, Loader } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Transfer {
  id: string;
  transactionId: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  amount: number;
  currency: string;
  recipientName: string;
  description: string;
  toAccountNumber: string;
  toBankCode: string;
  toBankName: string;
  type: 'transfer' | 'deposit';
  initiatedAt: string;
  completedAt?: string;
  updatedAt: string;
  metadata?: any;
}

interface TransferStats {
  totalTransfers: number;
  completedTransfers: number;
  pendingTransfers: number;
  failedTransfers: number;
}

interface Account {
  id: string;
  account_number: string;
  balance: number;
  currency: string;
}

function TransfersContent() {
  const { userId, isLoaded } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TransferStats>({
    totalTransfers: 0,
    completedTransfers: 0,
    pendingTransfers: 0,
    failedTransfers: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [totalBalance, setTotalBalance] = useState(0);

  // Fetch transfers and balance data
  const fetchTransferData = useCallback(async () => {
    if (!userId || !isLoaded) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/transfers/realtime-status?limit=50&offset=0`);
      if (!response.ok) throw new Error('Failed to fetch transfers');

      const data = await response.json();
      console.log('[v0] Transfer data received:', data);

      setTransfers(data.transfers || []);
      setAccounts(data.accounts || []);
      setStats(data.stats || {});
      setTotalBalance(data.totalBalance || 0);
    } catch (error) {
      console.error('[v0] Error fetching transfers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    fetchTransferData();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchTransferData, 5000);
    return () => clearInterval(interval);
  }, [fetchTransferData]);

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch =
      transfer.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toAccountNumber.includes(searchTerm) ||
      transfer.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || transfer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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

  const getStatusBadge = (status: string) => {
    const badges = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800' },
      'processing': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Transfers & Transactions</h1>
          <p className="text-muted-foreground">View and manage your transfer history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-foreground">${totalBalance.toFixed(2)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Transfers</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalTransfers}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
            <p className="text-green-700 dark:text-green-300 text-sm mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedTransfers}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">Processing</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pendingTransfers}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
            <p className="text-red-700 dark:text-red-300 text-sm mb-2">Failed</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failedTransfers}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, account, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Export Button */}
            <button className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg transition">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Transfers List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading transfers...</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <TrendingDown className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== 'all' ? 'No transfers match your filters' : 'No transfers yet'}
            </p>
            <Link href="/transfer">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition">
                Send Money
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Transfer Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      {getStatusIcon(transfer.status)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-foreground font-semibold truncate">
                          {transfer.recipientName}
                        </p>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded whitespace-nowrap">
                          {transfer.toBankCode}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {transfer.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(transfer.initiatedAt), 'MMM d, yyyy • h:mm a')}
                        {transfer.completedAt && (
                          <> • Completed {format(new Date(transfer.completedAt), 'h:mm a')}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Amount and Status */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-foreground mb-2">
                      -${transfer.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(transfer.status)}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Account</p>
                    <p className="text-foreground font-mono text-xs">{transfer.toAccountNumber.slice(-4).padStart(transfer.toAccountNumber.length, '*')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Type</p>
                    <p className="text-foreground capitalize text-xs">{transfer.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Transaction ID</p>
                    <p className="text-foreground font-mono text-xs">{transfer.transactionId.slice(0, 8).toUpperCase()}...</p>
                  </div>
                  {transfer.status === 'failed' && transfer.metadata?.failureReason && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Reason</p>
                      <p className="text-red-600 text-xs">{transfer.metadata.failureReason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/transfer">
            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition font-medium">
              Send Money
            </button>
          </Link>
          <Link href="/cards">
            <button className="w-full bg-card border border-border text-foreground py-3 rounded-lg hover:bg-muted transition font-medium">
              Manage Cards
            </button>
          </Link>
          <Link href="/accounts">
            <button className="w-full bg-card border border-border text-foreground py-3 rounded-lg hover:bg-muted transition font-medium">
              View Accounts
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function TransfersPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <TransfersContent />
    </ProtectedRoute>
  );
}
