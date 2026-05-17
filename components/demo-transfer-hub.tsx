'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';

interface DemoTransfer {
  id: string;
  transfer_reference: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  transfer_type: 'internal' | 'external';
  created_at: string;
  refund_date?: string;
  from_account_number?: string;
  daysUntilRefund?: number;
}

interface DemoTransferHubProps {
  userId: string;
}

export function DemoTransferHub({ userId }: DemoTransferHubProps) {
  const [transfers, setTransfers] = useState<DemoTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceived: 0,
    pendingRefunds: 0,
    completedCount: 0,
  });

  // Fetch user's demo transfers
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/api/demo-transfer/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setTransfers(data.transfers || []);
          
          // Calculate stats
          const completed = data.transfers.filter((t: DemoTransfer) => t.status === 'completed');
          const pending = data.transfers.filter((t: DemoTransfer) => t.status === 'pending');
          
          setStats({
            totalReceived: completed.reduce((sum: number, t: DemoTransfer) => sum + t.amount, 0),
            pendingRefunds: pending.length,
            completedCount: completed.length,
          });
        }
      } catch (error) {
        console.error('[v0] Error fetching demo transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'refunded':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Received</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'refunded':
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Demo Money Hub
        </h1>
        <p className="text-muted-foreground">Track your demo money transfers and pending refunds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold mt-1">
                ${stats.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{stats.completedCount} completed transfers</p>
            </div>
            <ArrowDownLeft className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Refunds</p>
              <p className="text-2xl font-bold mt-1">{stats.pendingRefunds}</p>
              <p className="text-xs text-muted-foreground mt-2">Will be refunded within 14 days</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transfers</p>
              <p className="text-2xl font-bold mt-1">{transfers.length}</p>
              <p className="text-xs text-muted-foreground mt-2">All transactions</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Transfers List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Transfers</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {transfers.length === 0 ? (
            <Card className="p-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No demo transfers yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <Card key={transfer.id} className={`p-4 border ${getStatusColor(transfer.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-full">
                        {getStatusIcon(transfer.status)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Demo Money Transfer</p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.transfer_reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        +${transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        {getStatusBadge(transfer.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(transfer.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {transfer.status === 'pending' && transfer.daysUntilRefund && (
                    <div className="mt-3 text-xs text-yellow-700 flex items-center gap-1 pl-12">
                      <Clock className="h-3 w-3" />
                      Auto-refunded in {transfer.daysUntilRefund} days
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {transfers.filter(t => t.status === 'pending').length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No pending transfers</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.filter(t => t.status === 'pending').map((transfer) => (
                <Card key={transfer.id} className="p-4 border border-yellow-200 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold">${transfer.amount.toLocaleString()}</p>
                        <p className="text-xs text-yellow-700">Pending - {transfer.transfer_reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transfer.daysUntilRefund ? `${transfer.daysUntilRefund} days left` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {transfers.filter(t => t.status === 'completed').length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No completed transfers</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.filter(t => t.status === 'completed').map((transfer) => (
                <Card key={transfer.id} className="p-4 border border-green-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold">${transfer.amount.toLocaleString()}</p>
                        <p className="text-xs text-green-700">Completed - {transfer.transfer_reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Received</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(transfer.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold">About Demo Money</p>
            <p className="mt-1">Demo money transfers from admins to external accounts are automatically refunded within 7-14 days. Transfers to registered users are instant and permanent.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
