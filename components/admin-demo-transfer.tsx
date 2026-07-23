'use client';

import React, { useState, useEffect } from 'react';
import { sendDemoTransfer, sendBulkDemoTransfer, getDemoTransferHistory, formatTransferForDisplay } from '@/lib/demo-transfer-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Users, DollarSign, ArrowUpRight, Loader2 } from 'lucide-react';

interface AdminDemoTransferProps {
  adminUserId: string;
}

export function AdminDemoTransfer({ adminUserId }: AdminDemoTransferProps) {
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [daysToRefund, setDaysToRefund] = useState('7');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('single');
  const [adminBalance, setAdminBalance] = useState(1000000);

  // Fetch transfer history
  const fetchHistory = async () => {
    setTransfersLoading(true);
    try {
      const data = await getDemoTransferHistory(adminUserId, { limit: 50 });
      setTransfers(data.transfers.map(formatTransferForDisplay));
    } catch (error) {
      console.error('[v0] Error fetching history:', error);
      setMessage('Failed to fetch transfer history');
      setMessageType('error');
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Calculate stats
  const stats = {
    totalSent: transfers.filter(t => t.status !== 'refunded').reduce((sum, t) => sum + t.amount, 0),
    pendingRefunds: transfers.filter(t => t.status === 'pending').length,
    completedTransfers: transfers.filter(t => t.status === 'completed').length
  };

  const handleSingleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toAccountNumber || !amount) {
      setMessage('Please fill all required fields');
      setMessageType('error');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || transferAmount > adminBalance) {
      setMessage('Invalid amount or insufficient balance');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await sendDemoTransfer({
        toAccountNumber,
        amount: transferAmount,
        daysToRefund: parseInt(daysToRefund),
        adminUserId,
      });

      setMessage(`Success! Transfer ${result.transferReference} sent.`);
      setMessageType('success');
      setAdminBalance(adminBalance - transferAmount);
      setToAccountNumber('');
      setAmount('');
      setDaysToRefund('7');

      // Refresh history
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!amount) {
      setMessage('Please enter an amount');
      setMessageType('error');
      return;
    }

    const transferAmount = parseFloat(amount);
    // Estimate users (for demo, assume ~10 users)
    const estimatedUsers = 10;
    const totalAmount = transferAmount * estimatedUsers;

    if (totalAmount > adminBalance) {
      setMessage('Insufficient balance for bulk transfer');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await sendBulkDemoTransfer({
        amount: transferAmount,
        daysToRefund: parseInt(daysToRefund),
        adminUserId,
      });

      setMessage(`Success! Sent ${transferAmount} to ${result.totalUsers || estimatedUsers} users.`);
      setMessageType('success');
      setAdminBalance(adminBalance - totalAmount);
      setAmount('');
      setDaysToRefund('7');

      // Refresh history
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'refunded':
        return <Badge className="bg-background text-foreground">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'internal' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demo Money Transfer</h1>
          <p className="text-muted-foreground">Manage demo money transfers and monitor system</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-base">
          Balance: ${adminBalance.toLocaleString()}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold">${stats.totalSent.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Refunds</p>
              <p className="text-2xl font-bold">{stats.pendingRefunds}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completedTransfers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg p-4 ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Transfer</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Single Transfer */}
        <TabsContent value="single" className="mt-6">
          <Card className="p-6">
            <form onSubmit={handleSingleTransfer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account">Recipient Account Number</Label>
                  <Input
                    id="account"
                    type="text"
                    value={toAccountNumber}
                    onChange={(e) => setToAccountNumber(e.target.value)}
                    placeholder="e.g., 1234567890"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Days Until Auto-Refund</Label>
                <select
                  id="days"
                  value={daysToRefund}
                  onChange={(e) => setDaysToRefund(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                </select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send Demo Money'}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Transfer */}
        <TabsContent value="bulk" className="mt-6">
          <Card className="p-6 space-y-6">
            <div className="rounded-lg bg-background border border-blue-200 p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">Send demo money to ALL registered users at once</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bulk-amount">Amount Per User (NGN)</Label>
                <Input
                  id="bulk-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount per user"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-days">Days Until Auto-Refund</Label>
                <select
                  id="bulk-days"
                  value={daysToRefund}
                  onChange={(e) => setDaysToRefund(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                </select>
              </div>

              <Button onClick={handleBulkTransfer} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send to All Users'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Transfer History */}
        <TabsContent value="history" className="mt-6">
          {transfersLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!transfersLoading && transfers.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No transfers yet</p>
            </Card>
          )}

          {!transfersLoading && transfers.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Reference</th>
                      <th className="px-6 py-3 text-left font-semibold">Account</th>
                      <th className="px-6 py-3 text-right font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Type</th>
                      <th className="px-6 py-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr key={transfer.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {transfer.transfer_reference}
                        </td>
                        <td className="px-6 py-4">{transfer.to_account_number}</td>
                        <td className="px-6 py-4 text-right font-semibold">
                          ₦{transfer.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(transfer.status)}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          {getTypeIcon(transfer.transfer_type)}
                          <span className="capitalize">{transfer.transfer_type}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
