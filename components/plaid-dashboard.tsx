'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { PlaidLinkButton } from './plaid-link-button';

interface Account {
  id: string;
  accountId: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: {
    current: number;
    available?: number;
    limit?: number;
  };
  institutionName?: string;
}

interface Transaction {
  id: string;
  accountId: string;
  date: string;
  name: string;
  amount: number;
  category?: string[];
  pending?: boolean;
}

export function PlaidDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(true);

  // Fetch accounts and transactions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('[v0] No auth token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/plaid/accounts', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
          if (data.accounts?.[0]) {
            setActiveAccount(data.accounts[0].accountId);
          }
          if (data.transactions) {
            setTransactions(data.transactions);
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeAccountData = accounts.find((a) => a.accountId === activeAccount);
  const accountTransactions = activeAccount
    ? transactions.filter((t) => t.accountId === activeAccount).slice(0, 10)
    : [];

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balances.current || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No accounts linked</h3>
          <p className="text-muted-foreground mb-6">Connect your bank account to see your balance and transactions.</p>
          <PlaidLinkButton />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="text-background">
            <p className="text-sm font-medium opacity-90">Total Balance</p>
            <div className="flex items-center gap-2 mt-2">
              {!showBalances && <Eye className="h-4 w-4 cursor-pointer" onClick={() => setShowBalances(!showBalances)} />}
              <h2 className="text-4xl font-bold">
                {showBalances ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
              </h2>
              {showBalances && <Eye className="h-4 w-4 cursor-pointer opacity-75" onClick={() => setShowBalances(!showBalances)} />}
            </div>
          </div>
          <div className="text-background opacity-75">
            <CreditCard className="h-12 w-12" />
          </div>
        </div>
      </Card>

      {/* Accounts Section */}
      <Tabs value={activeAccount || ''} onValueChange={setActiveAccount} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))` }}>
          {accounts.map((account) => (
            <TabsTrigger key={account.accountId} value={account.accountId} className="truncate">
              <span className="text-xs font-medium">•••{account.mask}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account) => (
          <TabsContent key={account.accountId} value={account.accountId} className="space-y-4">
            {/* Account Details Card */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.institutionName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Type</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {account.subtype}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold mt-1">
                      {showBalances ? `$${account.balances.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                    </p>
                  </div>
                  {account.balances.available !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        {showBalances ? `$${account.balances.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Recent Transactions
              </h3>
              {accountTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found</p>
              ) : (
                <div className="space-y-3">
                  {accountTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{transaction.name}</p>
                        {transaction.category && (
                          <p className="text-xs text-muted-foreground">{transaction.category[0]}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Link Another Account */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Add Another Account</h3>
        <PlaidLinkButton />
      </Card>
    </div>
  );
}
