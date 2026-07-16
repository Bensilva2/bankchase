'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { CreditCard, Lock, Eye, EyeOff, Plus, MoreVertical, Check, Clock, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Card {
  id: string;
  userId: string;
  accountId: string;
  type: 'virtual' | 'physical';
  brand: string;
  lastFour: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  status: 'active' | 'frozen' | 'cancelled' | 'expired' | 'pending_activation';
  design: string;
  balance: number;
  currency: string;
  spendingControls: {
    dailyLimit: number;
    monthlyLimit: number;
    singleTransactionLimit: number;
  };
  metadata: {
    issuedAt: string;
    activatedAt?: string;
    lastUsedAt?: string;
  };
}

function CardsContent() {
  const { userId, isLoaded } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCardNumbers, setShowCardNumbers] = useState<{ [key: string]: boolean }>({});
  const [activatingCard, setActivatingCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationData, setActivationData] = useState({ lastFourDigits: '' });

  // Fetch cards
  const fetchCards = useCallback(async () => {
    if (!userId || !isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      setCards(data.cards || []);
    } catch (err) {
      console.error('[v0] Error fetching cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    fetchCards();
    const interval = setInterval(fetchCards, 5000); // Real-time updates every 5 seconds
    return () => clearInterval(interval);
  }, [fetchCards]);

  const handleActivateCard = (card: Card) => {
    if (card.status !== 'pending_activation') return;
    setSelectedCard(card);
    setShowActivationModal(true);
  };

  const submitActivation = async () => {
    if (!selectedCard || !activationData.lastFourDigits) {
      setError('Please enter the last 4 digits of your card');
      return;
    }

    setActivatingCard(selectedCard.id);
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          cardId: selectedCard.id,
          lastFourDigits: activationData.lastFourDigits
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Activation failed');
      }

      toast.success('Card activated successfully!');
      await fetchCards();
      setShowActivationModal(false);
      setActivationData({ lastFourDigits: '' });
      setSelectedCard(null);
    } catch (err) {
      console.error('[v0] Activation error:', err);
      toast.error(err instanceof Error ? err.message : 'Activation failed');
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActivatingCard(null);
    }
  };

  const handleFreezeCard = async (cardId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'freeze',
          cardId,
          frozen: !currentStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update card status');
      toast.success(!currentStatus ? 'Card frozen' : 'Card unfrozen');
      await fetchCards();
    } catch (err) {
      console.error('[v0] Freeze error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update card');
      setError(err instanceof Error ? err.message : 'Failed to update card');
    }
  };

  const handleCancelCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to cancel this card?')) return;

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cardId
        })
      });

      if (!response.ok) throw new Error('Failed to cancel card');
      toast.success('Card cancelled successfully');
      await fetchCards();
    } catch (err) {
      console.error('[v0] Cancel error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel card');
      setError(err instanceof Error ? err.message : 'Failed to cancel card');
    }
  };

  const getStatusBadge = (status: Card['status']) => {
    const badges = {
      'active': { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: 'Active' },
      'frozen': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Frozen' },
      'cancelled': { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Cancelled' },
      'expired': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: 'Expired' },
      'pending_activation': { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', label: 'Pending' }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Cards</h1>
            <p className="text-muted-foreground">Manage your digital and physical cards</p>
          </div>
          <Link href="/cards/issue">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition">
              <Plus className="w-4 h-4" />
              Issue Card
            </button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground mb-4">No cards yet</p>
            <Link href="/cards/issue">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition">
                Issue Your First Card
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.id} className="group">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition relative overflow-hidden">
                  {/* Card Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
                  </div>

                  {/* Card Content */}
                  <div className="relative z-10">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-12">
                      <div>
                        <p className="text-white/80 text-xs uppercase tracking-wider mb-1">{card.type} Card</p>
                        <CreditCard className="w-8 h-8 text-white/70" />
                      </div>
                      <div className="relative group/menu">
                        <button className="text-white/70 hover:text-white p-1">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg min-w-48 hidden group-hover/menu:block z-50">
                          {card.status === 'active' && (
                            <button
                              onClick={() => handleFreezeCard(card.id, false)}
                              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50"
                            >
                              Freeze Card
                            </button>
                          )}
                          {card.status === 'frozen' && (
                            <button
                              onClick={() => handleFreezeCard(card.id, true)}
                              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50"
                            >
                              Unfreeze Card
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelCard(card.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted/50"
                          >
                            Cancel Card
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="mb-8">
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Card Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl tracking-widest font-mono">
                          •••• •••• •••• {card.lastFour}
                        </p>
                        <button
                          onClick={() => setShowCardNumbers(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                          className="text-white/70 hover:text-white"
                        >
                          {showCardNumbers[card.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Cardholder</p>
                        <p className="text-sm font-semibold">{card.cardholderName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Expires</p>
                        <p className="text-sm font-semibold">{card.expiryMonth}/{card.expiryYear}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="mt-4 space-y-3">
                  {/* Balance */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground">${card.balance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{card.currency}</p>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <div>{getStatusBadge(card.status)}</div>
                    {card.status === 'pending_activation' && (
                      <button
                        onClick={() => handleActivateCard(card)}
                        disabled={activatingCard === card.id}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded transition"
                      >
                        {activatingCard === card.id ? (
                          <>
                            <Clock className="w-3 h-3 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Activate
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Spending Limits */}
                  <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                    <p className="text-muted-foreground">Daily Limit: ${card.spendingControls.dailyLimit.toFixed(2)}</p>
                    <p className="text-muted-foreground">Monthly Limit: ${card.spendingControls.monthlyLimit.toFixed(2)}</p>
                  </div>

                  {/* Transfer Button */}
                  {card.status === 'active' && (
                    <Link href={`/transfer?cardId=${card.id}`}>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Transfer Money
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activation Modal */}
      {showActivationModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Activate Card</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Enter the last 4 digits of your card to activate it.
            </p>

            <input
              type="text"
              maxLength={4}
              placeholder="0000"
              value={activationData.lastFourDigits}
              onChange={(e) => setActivationData({ lastFourDigits: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-center text-2xl tracking-widest font-mono mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setActivationData({ lastFourDigits: '' });
                }}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitActivation}
                disabled={activatingCard === selectedCard.id}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg transition font-medium"
              >
                {activatingCard === selectedCard.id ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CardsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <CardsContent />
    </ProtectedRoute>
  );
}
